package com.learnnow.user.service;

import com.learnnow.user.dto.*;
import com.learnnow.user.entity.*;
import com.learnnow.user.repository.*;
import com.learnnow.common.security.*;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.learnnow.common.exception.AuthException;
import com.learnnow.common.exception.ConflictException;
import com.learnnow.common.exception.ValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Collections;
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

    @Value("${app.google.client-id:}")
    private String googleClientId;

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
            throw new ConflictException("user_already_created");
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
                .orElseThrow(() -> new AuthException("token_invalid"));

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new AuthException("user_not_found"));

        if (token.isUsed()) {
            if (user.isEmailVerified()) {
                String jwt = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());
                UserDto profile = buildUserDto(user);
                return new AuthResponse(jwt, profile);
            }
            throw new AuthException("token_already_used");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthException("token_expired");
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
                .orElseThrow(() -> new AuthException("user_not_found"));

        if (user.isEmailVerified()) {
            throw new AuthException("email_already_verified");
        }

        tokenRepository.deleteByUserId(user.getId());

        issueVerificationToken(user);
    }

    @Transactional
    public AuthResponse googleLogin(GoogleAuthRequest req) {
        GoogleIdToken.Payload payload = verifyGoogleIdToken(req.idToken());
        String email = payload.getEmail();
        String googleSub = payload.getSubject();
        String givenName = (String) payload.get("given_name");
        String familyName = (String) payload.get("family_name");
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        if (email == null || email.isBlank()) {
            throw new ValidationException("google_token_invalid_email");
        }

        User user = userRepository.findByGoogleSub(googleSub)
                .orElseGet(() -> userRepository.findByEmailIgnoreCase(email).orElse(null));

        if (user != null) {
            if (user.getGoogleSub() == null) {
                user.setGoogleSub(googleSub);
            }
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
            }
            if (user.getAvatar() == null && picture != null) {
                user.setAvatar(picture);
            }
            userRepository.save(user);
        } else {
            String userId = UUID.randomUUID().toString();
            String firstName = givenName != null ? givenName : (name != null ? name : "Learner");
            String lastName = familyName != null ? familyName : "";
            String fullName = name != null ? name : (firstName + " " + lastName).trim();

            user = User.builder()
                    .id(userId)
                    .email(email.toLowerCase())
                    .firstName(firstName)
                    .lastName(lastName)
                    .fullName(fullName)
                    .passwordHash(null)
                    .googleSub(googleSub)
                    .emailVerified(true)
                    .avatar(picture != null ? picture : UUID.randomUUID().toString())
                    .role("USER")
                    .build();

            userRepository.save(user);
        }

        String jwt = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserDto profile = buildUserDto(user);
        return new AuthResponse(jwt, profile);
    }

    private GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        try {
            HttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
            JsonFactory jsonFactory = GsonFactory.getDefaultInstance();

            GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(transport, jsonFactory);
            if (googleClientId != null && !googleClientId.isBlank()) {
                verifierBuilder.setAudience(Collections.singletonList(googleClientId));
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                return idToken.getPayload();
            } else {
                throw new ValidationException("invalid_google_token");
            }
        } catch (ValidationException ve) {
            throw ve;
        } catch (Exception e) {
            throw new ValidationException("google_auth_failed: " + e.getMessage());
        }
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new AuthException("user_credentials_mismatched"));

        if (user.getPasswordHash() == null) {
            throw new AuthException("account_registered_with_google");
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new AuthException("user_credentials_mismatched");
        }

        if (!user.isEmailVerified()) {
            throw new AuthException("email_not_verified");
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
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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
