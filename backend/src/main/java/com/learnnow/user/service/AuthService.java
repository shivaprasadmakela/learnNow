package com.learnnow.user.service;

import com.learnnow.user.dto.*;
import com.learnnow.user.entity.*;
import com.learnnow.user.repository.*;
import com.learnnow.common.security.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResendEmailClient emailClient;
    private final TokenService tokenService;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    public AuthService(UserRepository userRepository,
                        EmailVerificationTokenRepository tokenRepository,
                        PasswordEncoder passwordEncoder,
                        ResendEmailClient emailClient,
                        TokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailClient = emailClient;
        this.tokenService = tokenService;
    }

    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new RuntimeException("user_already_created");
        }

        String userId = UUID.randomUUID().toString();
        String fullName = req.firstName() + " " + req.lastName();

        User user = User.builder()
                .id(userId)
                .email(req.email().toLowerCase())
                .firstName(req.firstName())
                .lastName(req.lastName())
                .fullName(fullName)
                .passwordHash(passwordEncoder.encode(req.password()))
                .avatar(UUID.randomUUID().toString())
                .emailVerified(false)
                .build();

        userRepository.save(user);
        issueVerificationToken(user);
    }

    private void issueVerificationToken(User user) {
        String rawToken = generateSecureToken();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .userId(user.getId())
                .tokenHash(sha256(rawToken))
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();

        tokenRepository.save(token);

        String link = appBaseUrl + "/verify-email?token=" + rawToken;
        emailClient.sendVerificationEmail(user.getEmail(), user.getFirstName(), link);
    }

    @Transactional
    public AuthResponse verifyEmail(String rawToken) {
        String hash = sha256(rawToken);
        EmailVerificationToken token = tokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new RuntimeException("token_invalid"));

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new RuntimeException("user_not_found"));

        if (token.isUsed()) {
            if (user.isEmailVerified()) {
                String jwt = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());
                UserDto profile = buildUserDto(user);
                return new AuthResponse(jwt, profile);
            }
            throw new RuntimeException("token_already_used");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("token_expired");
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        String jwt = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserDto profile = buildUserDto(user);
        return new AuthResponse(jwt, profile);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("user_not_found"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("email_already_verified");
        }

        tokenRepository.deleteByUserId(user.getId());

        issueVerificationToken(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new RuntimeException("user_credentials_mismatched"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new RuntimeException("user_credentials_mismatched");
        }

        if (!user.isEmailVerified()) {
            throw new RuntimeException("email_not_verified");
        }

        String token = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserDto profile = buildUserDto(user);

        return new AuthResponse(token, profile);
    }

    private UserDto buildUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatar(),
                user.getRole(),
                user.getBio()
        );
    }

    private String generateSecureToken() {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(UUID.randomUUID().toString().getBytes());
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
