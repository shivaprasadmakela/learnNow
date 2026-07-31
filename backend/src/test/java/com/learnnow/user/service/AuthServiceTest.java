package com.learnnow.user.service;

import com.learnnow.common.exception.ValidationException;
import com.learnnow.common.security.ResendEmailClient;
import com.learnnow.common.security.TokenService;
import com.learnnow.user.dto.LoginRequest;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.EmailVerificationTokenRepository;
import com.learnnow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepository userRepository;
    private EmailVerificationTokenRepository tokenRepository;
    private PasswordEncoder passwordEncoder;
    private ResendEmailClient emailClient;
    private TokenService tokenService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        tokenRepository = Mockito.mock(EmailVerificationTokenRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        emailClient = new ResendEmailClient("test-key");
        tokenService = Mockito.mock(TokenService.class);

        authService = new AuthService(userRepository, tokenRepository, passwordEncoder, emailClient, tokenService);
    }

    @Test
    void testLoginFailsForGoogleOnlyUserWithoutPassword() {
        User googleUser = User.builder()
                .id("u-123")
                .email("googleuser@example.com")
                .passwordHash(null)
                .googleSub("sub-12345")
                .emailVerified(true)
                .build();

        when(userRepository.findByEmailIgnoreCase("googleuser@example.com"))
                .thenReturn(Optional.of(googleUser));

        LoginRequest req = new LoginRequest("googleuser@example.com", "anyPassword");

        ValidationException ex = assertThrows(ValidationException.class, () -> authService.login(req));
        assertEquals("account_registered_with_google", ex.getMessage());
    }
}
