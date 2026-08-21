package com.learnnow.common.config;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Fails startup on any configuration that would be unsafe at runtime.
 *
 * <p>The intent is that a misconfigured deployment never reaches a serving state. Silent fallbacks
 * are far more dangerous than a refused boot: a shared development JWT secret or an enabled payment
 * mock is not something to discover from production traffic.
 */
@Slf4j
@Component
public class StartupConfigValidator {

    /** HS256 requires a key of at least 256 bits. */
    private static final int MIN_JWT_SECRET_BYTES = 32;

    private static final String LOCAL_PROFILE = "local";

    private final Environment environment;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${app.payments.mock-enabled:false}")
    private boolean paymentsMockEnabled;

    public StartupConfigValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validate() {
        boolean isLocal = Arrays.asList(environment.getActiveProfiles()).contains(LOCAL_PROFILE);

        validateJwtSecret();
        validateCorsOrigins();
        validateGoogleClientId();

        if (!isLocal) {
            validateProductionPayments();
        } else if (paymentsMockEnabled) {
            log.warn(
                    "Payment mock is ENABLED. Payment signatures are accepted without"
                            + " verification. This is only valid for local development.");
        }

        log.info(
                "Startup configuration validated (profiles: {})",
                Arrays.toString(environment.getActiveProfiles()));
    }

    private void validateJwtSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET is not set. Generate one with: openssl rand -base64 32");
        }
        int length = jwtSecret.getBytes(StandardCharsets.UTF_8).length;
        if (length < MIN_JWT_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET is too short ("
                            + length
                            + " bytes). HS256 requires at least "
                            + MIN_JWT_SECRET_BYTES
                            + " bytes.");
        }
    }

    private void validateCorsOrigins() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            throw new IllegalStateException("ALLOWED_ORIGINS is not set.");
        }
        for (String origin : allowedOrigins.split(",")) {
            String trimmed = origin.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.contains("*")) {
                throw new IllegalStateException(
                        "ALLOWED_ORIGINS contains a wildcard ('"
                                + trimmed
                                + "'). Credentialed CORS requires exact origins.");
            }
            if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
                throw new IllegalStateException(
                        "ALLOWED_ORIGINS entry '" + trimmed + "' must include a scheme.");
            }
        }
    }

    private void validateGoogleClientId() {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException(
                    "GOOGLE_CLIENT_ID is not set. It is required as the ID token audience;"
                            + " without it Google sign-in would accept tokens issued to any"
                            + " OAuth client.");
        }
    }

    private void validateProductionPayments() {
        if (paymentsMockEnabled) {
            throw new IllegalStateException(
                    "app.payments.mock-enabled must be false outside the local profile.");
        }
        if (razorpayKeyId == null
                || razorpayKeyId.isBlank()
                || razorpayKeyId.contains("placeholder")) {
            throw new IllegalStateException(
                    "RAZORPAY_KEY_ID is missing or still a placeholder outside local development.");
        }
    }
}
