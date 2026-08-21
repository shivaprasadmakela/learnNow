package com.learnnow.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.learnnow.common.exception.AuthException;
import com.learnnow.common.security.ResendEmailClient;
import com.learnnow.common.security.TokenService;
import com.learnnow.user.dto.request.LoginRequest;
import com.learnnow.user.dto.request.RegisterRequest;
import com.learnnow.user.entity.User;
import com.learnnow.user.mapper.UserDtoMapper;
import com.learnnow.user.repository.EmailVerificationTokenRepository;
import com.learnnow.user.repository.PasswordResetTokenRepository;
import com.learnnow.user.repository.RefreshTokenRepository;
import com.learnnow.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    private UserRepository userRepository;
    private EmailVerificationTokenRepository tokenRepository;
    private PasswordResetTokenRepository passwordResetTokenRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private PasswordEncoder passwordEncoder;
    private ResendEmailClient emailClient;
    private TokenService tokenService;
    private UserDtoMapper userDtoMapper;
    private GoogleIdTokenVerifier googleIdTokenVerifier;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        tokenRepository = Mockito.mock(EmailVerificationTokenRepository.class);
        passwordResetTokenRepository = Mockito.mock(PasswordResetTokenRepository.class);
        refreshTokenRepository = Mockito.mock(RefreshTokenRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        emailClient = Mockito.mock(ResendEmailClient.class);
        tokenService = Mockito.mock(TokenService.class);
        userDtoMapper = Mockito.mock(UserDtoMapper.class);
        googleIdTokenVerifier = Mockito.mock(GoogleIdTokenVerifier.class);

        authService =
                new AuthService(
                        userRepository,
                        tokenRepository,
                        passwordResetTokenRepository,
                        refreshTokenRepository,
                        passwordEncoder,
                        emailClient,
                        tokenService,
                        userDtoMapper,
                        googleIdTokenVerifier);
    }

    @Test
    @DisplayName("login gives the same error for an SSO-only account as for a wrong password")
    void loginDoesNotRevealThatAnAccountUsesGoogleSso() {
        User googleUser =
                User.builder()
                        .id("u-123")
                        .email("googleuser@example.com")
                        .passwordHash(null)
                        .googleSub("sub-12345")
                        .emailVerified(true)
                        .build();

        when(userRepository.findByEmailIgnoreCase("googleuser@example.com"))
                .thenReturn(Optional.of(googleUser));

        LoginRequest req = new LoginRequest("googleuser@example.com", "anyPassword123");

        AuthException ex = assertThrows(AuthException.class, () -> authService.login(req));
        // Previously "account_registered_with_google", which told an attacker both that
        // the address existed and that it used SSO.
        assertEquals("user_credentials_mismatched", ex.getMessage());
    }

    @Test
    @DisplayName("login gives that same error for an address with no account at all")
    void loginDoesNotRevealWhetherAnAddressExists() {
        when(userRepository.findByEmailIgnoreCase("nobody@example.com"))
                .thenReturn(Optional.empty());

        AuthException ex =
                assertThrows(
                        AuthException.class,
                        () ->
                                authService.login(
                                        new LoginRequest("nobody@example.com", "pw12345678")));
        assertEquals("user_credentials_mismatched", ex.getMessage());
    }

    @Test
    @DisplayName("registering an address that already exists succeeds and notifies the owner")
    void registerDoesNotRevealThatAnAddressIsTaken() {
        when(userRepository.existsByEmailIgnoreCase("taken@example.com")).thenReturn(true);

        RegisterRequest req =
                new RegisterRequest("Ada", "Lovelace", "taken@example.com", "correcthorsebattery");

        // No exception: reporting the collision was an enumeration oracle.
        assertDoesNotThrow(() -> authService.register(req));

        // No second account, and the real owner is told by email instead.
        verify(userRepository, never()).save(any(User.class));
        verify(emailClient).sendAccountExistsEmail(anyString(), anyString());
    }
}
