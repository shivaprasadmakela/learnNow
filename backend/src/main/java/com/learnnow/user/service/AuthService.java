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
            throw new RuntimeException("Email already registered!");
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
                .dateOfBirth(req.dateOfBirth())
                .emailVerified(false)
                .avatar("👨‍💻")
                .role("Fullstack Developer Apprentice")
                .bio("Learning React & Spring Boot on learnNow!")
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
        // In local development we will print the link to standard output so developers can access it without a Resend account key!
        System.out.println("==================================================");
        System.out.println("VERIFICATION LINK FOR " + user.getEmail() + ":");
        System.out.println(link);
        System.out.println("==================================================");

        emailClient.sendVerificationEmail(user.getEmail(), user.getFirstName(), link);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        String hash = sha256(rawToken);
        EmailVerificationToken token = tokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new RuntimeException("Invalid token!"));

        if (token.isUsed()) {
            throw new RuntimeException("Token already used!");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Token expired!");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        user.setEmailVerified(true);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email!"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified!");
        }

        // Invalidate old tokens
        tokenRepository.deleteByUserId(user.getId());

        issueVerificationToken(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new RuntimeException("Invalid email or password!"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password!");
        }

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email address before logging in.");
        }

        String token = tokenService.generateToken(user.getId(), user.getEmail());
        UserDto profile = new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatar(),
                user.getRole(),
                user.getBio()
        );

        return new AuthResponse(token, profile);
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
