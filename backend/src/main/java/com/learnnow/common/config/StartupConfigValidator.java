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
            if (!trimmed.isEmpty()) {
                validateOrigin(trimmed);
            }
        }
    }

    /**
     * Rejects an origin only when its wildcard is broad enough to match hosts we do not control.
     *
     * <p>A scoped wildcard is legitimate and necessary: preview deployments get a fresh subdomain
     * per build, so {@code https://*.vercel.app} cannot be replaced by an enumerated list. What
     * must not get through is a wildcard that matches arbitrary hosts, because these origins are
     * paired with {@code allowCredentials} - any site it matches could read authenticated
     * responses. The line drawn here is that a wildcard must leave a concrete registrable domain
     * behind it: {@code *.vercel.app} is accepted, {@code *.com} and {@code https://*} are not.
     */
    private void validateOrigin(String origin) {
        if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
            throw new IllegalStateException(
                    "ALLOWED_ORIGINS entry '" + origin + "' must include a scheme.");
        }

        String host = origin.substring(origin.indexOf("://") + 3);
        // Strip any port or path so the host is what gets inspected.
        host = host.split("/")[0].split(":")[0];

        if (!host.contains("*")) {
            return;
        }
        if (host.equals("*")) {
            throw new IllegalStateException(
                    "ALLOWED_ORIGINS entry '"
                            + origin
                            + "' matches every host. Credentialed CORS cannot use a bare"
                            + " wildcard.");
        }
        if (!host.startsWith("*.") || host.lastIndexOf('*') > 0) {
            throw new IllegalStateException(
                    "ALLOWED_ORIGINS entry '"
                            + origin
                            + "' is malformed. A wildcard is only allowed as the leading subdomain,"
                            + " e.g. https://*.example.com");
        }

        // "*.vercel.app" -> "vercel.app". Two labels is the minimum that names a real domain;
        // one label would be a bare public suffix such as "*.com".
        String suffix = host.substring(2);
        if (suffix.chars().filter(c -> c == '.').count() < 1 || suffix.startsWith(".")) {
            throw new IllegalStateException(
                    "ALLOWED_ORIGINS entry '"
                            + origin
                            + "' is too broad - a wildcard must be scoped to a specific domain,"
                            + " e.g. https://*.example.com");
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
