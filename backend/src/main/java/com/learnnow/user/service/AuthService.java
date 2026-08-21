package com.learnnow.user.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.learnnow.common.exception.AuthException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.common.security.*;
import com.learnnow.user.dto.request.*;
import com.learnnow.user.dto.response.*;
import com.learnnow.user.entity.*;
import com.learnnow.user.mapper.UserDtoMapper;
import com.learnnow.user.repository.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthService {

    private static final long RESET_TOKEN_TTL_MINUTES = 60;
    private static final long REFRESH_TOKEN_TTL_DAYS = 30;
    private static final long VERIFICATION_TOKEN_TTL_HOURS = 24;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResendEmailClient emailClient;
    private final TokenService tokenService;
    private final UserDtoMapper userDtoMapper;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    public AuthService(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            ResendEmailClient emailClient,
            TokenService tokenService,
            UserDtoMapper userDtoMapper,
            GoogleIdTokenVerifier googleIdTokenVerifier) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailClient = emailClient;
        this.tokenService = tokenService;
        this.userDtoMapper = userDtoMapper;
        this.googleIdTokenVerifier = googleIdTokenVerifier;
    }

    /**
     * Registers a new account.
     *
     * <p>Returns successfully whether or not the address was already taken. Signalling the
     * collision let anyone enumerate which addresses have accounts; the existing owner is told by
     * email instead, which is the only channel that proves they own the address.
     */
    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            log.info("Registration attempted for an address that already exists");
            emailClient.sendAccountExistsEmail(req.email().toLowerCase(), req.firstName());
            return;
        }

        String userId = UUID.randomUUID().toString();
        String fullName = req.firstName() + " " + req.lastName();

        User user =
                User.builder()
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
        EmailVerificationToken token =
                EmailVerificationToken.builder()
                        .userId(user.getId())
                        .tokenHash(sha256(rawToken))
                        .expiresAt(
                                Instant.now().plus(VERIFICATION_TOKEN_TTL_HOURS, ChronoUnit.HOURS))
                        .build();

        tokenRepository.save(token);

        String link = appBaseUrl + "/verify-email?token=" + rawToken;
        emailClient.sendVerificationEmail(user.getEmail(), user.getFirstName(), link);
    }

    @Transactional
    public AuthResponse verifyEmail(String rawToken) {
        String hash = sha256(rawToken);
        EmailVerificationToken token =
                tokenRepository
                        .findByTokenHash(hash)
                        .orElseThrow(() -> new AuthException("token_invalid"));

        User user =
                userRepository
                        .findById(token.getUserId())
                        .orElseThrow(() -> new AuthException("user_not_found"));

        if (token.isUsed()) {
            if (user.isEmailVerified()) {
                return issueSession(user);
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

        return issueSession(user);
    }

    /** Silent on both unknown addresses and already-verified accounts, for the same reason. */
    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || user.isEmailVerified()) {
            log.info("Verification resend requested for an unknown or already-verified address");
            return;
        }
        tokenRepository.deleteByUserId(user.getId());
        issueVerificationToken(user);
    }

    /**
     * Starts a password reset. Always succeeds from the caller's point of view.
     *
     * <p>Google-only accounts are skipped silently rather than reported, since saying so would
     * reveal which addresses use SSO.
     */
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || user.getPasswordHash() == null) {
            log.info("Password reset requested for an unknown or passwordless address");
            return;
        }

        passwordResetTokenRepository.deleteByUserId(user.getId());

        String rawToken = generateSecureToken();
        passwordResetTokenRepository.save(
                PasswordResetToken.builder()
                        .userId(user.getId())
                        .tokenHash(sha256(rawToken))
                        .expiresAt(Instant.now().plus(RESET_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES))
                        .build());

        emailClient.sendPasswordResetEmail(
                user.getEmail(),
                user.getFirstName(),
                appBaseUrl + "/reset-password?token=" + rawToken);
    }

    /** Completes a password reset and invalidates the grant so the link cannot be replayed. */
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token =
                passwordResetTokenRepository
                        .findByTokenHash(sha256(rawToken))
                        .orElseThrow(() -> new AuthException("token_invalid"));

        if (token.isUsed()) {
            throw new AuthException("token_already_used");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthException("token_expired");
        }

        User user =
                userRepository
                        .findById(token.getUserId())
                        .orElseThrow(() -> new AuthException("user_not_found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // A reset proves control of the mailbox, so it also settles verification.
        user.setEmailVerified(true);
        // Bumping this invalidates every access token issued before the reset, so a
        // stolen token cannot outlive the password it was obtained with.
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        // Any session established with the old password is ended.
        refreshTokenRepository.revokeAllForUser(user.getId());

        log.info("Password reset completed for user {}", user.getId());
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

        User user =
                userRepository
                        .findByGoogleSub(googleSub)
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

            user =
                    User.builder()
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

        return issueSession(user);
    }

    /**
     * Verifies a Google ID token.
     *
     * <p>The audience check is unconditional. It used to be applied only when a client id happened
     * to be configured, which meant an unset {@code GOOGLE_CLIENT_ID} silently downgraded this to
     * "any token Google ever signed" - including one minted by an OAuth client the attacker
     * registered themselves. {@code StartupConfigValidator} refuses to boot without the client id,
     * and the verifier is a singleton so Google's certificate cache is reused.
     */
    private GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        try {
            GoogleIdToken idToken = googleIdTokenVerifier.verify(idTokenString);
            if (idToken == null) {
                throw new ValidationException("invalid_google_token");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();

            // Without this, a Google identity holding an unverified address that happens to
            // match an existing password account would take that account over via the
            // email-based linking below.
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new ValidationException("google_email_not_verified");
            }
            return payload;
        } catch (ValidationException ve) {
            throw ve;
        } catch (Exception e) {
            log.warn("Google ID token verification failed", e);
            throw new ValidationException("google_auth_failed");
        }
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email()).orElse(null);

        // One generic failure for every wrong-credential case. Distinguishing "no such
        // user" from "that account uses Google" told an attacker which addresses exist
        // and which use SSO.
        if (user == null
                || user.getPasswordHash() == null
                || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new AuthException("user_credentials_mismatched");
        }

        // Reported distinctly on purpose: the caller has already proven the password, so
        // this leaks nothing, and the UI needs it to offer a resend.
        if (!user.isEmailVerified()) {
            throw new AuthException("email_not_verified");
        }

        return issueSession(user);
    }

    private UserDto buildUserDto(User user) {
        return userDtoMapper.toDto(user);
    }

    /** Mints an access token plus a fresh refresh token, and returns the full auth payload. */
    private AuthResponse issueSession(User user) {
        String accessToken =
                tokenService.generateToken(
                        user.getId(), user.getEmail(), user.getRole(), user.getTokenVersion());
        String rawRefresh = generateSecureToken();
        refreshTokenRepository.save(
                RefreshToken.builder()
                        .userId(user.getId())
                        .tokenHash(sha256(rawRefresh))
                        .expiresAt(Instant.now().plus(REFRESH_TOKEN_TTL_DAYS, ChronoUnit.DAYS))
                        .build());
        return new AuthResponse(
                accessToken,
                rawRefresh,
                tokenService.getAccessTokenTtl().toSeconds(),
                buildUserDto(user));
    }

    /**
     * Exchanges a refresh token for a new session, rotating the refresh token in the process so a
     * captured one is single-use. A token whose user has since bumped {@code tokenVersion} - after
     * a password reset, say - is refused.
     */
    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshToken stored =
                refreshTokenRepository
                        .findByTokenHash(sha256(rawRefreshToken))
                        .orElseThrow(() -> new AuthException("refresh_token_invalid"));

        if (!stored.isUsable(Instant.now())) {
            throw new AuthException("refresh_token_expired");
        }

        User user =
                userRepository
                        .findById(stored.getUserId())
                        .orElseThrow(() -> new AuthException("user_not_found"));

        // Rotation: the presented token is spent whether or not the caller sees the response.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueSession(user);
    }

    /** Signs the caller out by revoking the presented refresh token. */
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository
                .findByTokenHash(sha256(rawRefreshToken))
                .ifPresent(
                        token -> {
                            token.setRevoked(true);
                            refreshTokenRepository.save(token);
                        });
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes =
                    digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
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
