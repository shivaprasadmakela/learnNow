package com.learnnow.common.config;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * The wildcard rule has to hold two things apart: preview deployments legitimately need a scoped
 * wildcard, while a wildcard matching arbitrary hosts would let any site read credentialed
 * responses.
 */
class StartupConfigValidatorTest {

    /**
     * Built rather than written as a literal. A 48-character literal on a field named jwtSecret
     * trips secret scanners on entropy alone, and a test fixture is not worth an allowlist
     * exception that would also cover real leaks.
     */
    private static final String DUMMY_SECRET = "not-a-secret-".repeat(4);

    private StartupConfigValidator validatorFor(String allowedOrigins) {
        return validatorFor(allowedOrigins, new MockEnvironment());
    }

    private StartupConfigValidator validatorFor(String allowedOrigins, MockEnvironment env) {
        StartupConfigValidator v = new StartupConfigValidator(env);
        ReflectionTestUtils.setField(v, "jwtSecret", DUMMY_SECRET);
        ReflectionTestUtils.setField(v, "allowedOrigins", allowedOrigins);
        ReflectionTestUtils.setField(v, "googleClientId", "client-id.apps.googleusercontent.com");
        ReflectionTestUtils.setField(v, "razorpayKeyId", "rzp_test_x");
        ReflectionTestUtils.setField(v, "paymentsMockEnabled", false);
        return v;
    }

    @Test
    @DisplayName("the real production configuration is accepted, wildcard included")
    void acceptsTheActualDeployedOrigins() {
        assertDoesNotThrow(
                () ->
                        validatorFor(
                                        "https://dev.learnnow.shivaprasadm.in,"
                                                + "https://learnnow.shivaprasadm.in,"
                                                + "https://*.vercel.app,"
                                                + "http://localhost:5173,"
                                                + "http://localhost:3000")
                                .validate());
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "https://*.vercel.app",
                "https://*.preview.example.com",
                "https://app.example.com",
                "http://localhost:5173"
            })
    @DisplayName("scoped wildcards and exact origins are allowed")
    void allowsScopedOrigins(String origin) {
        assertDoesNotThrow(() -> validatorFor(origin).validate());
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "*", // matches everything
                "https://*", // any host
                "https://*.com", // a bare public suffix
                "https://*.*", // nothing concrete left
                "https://ex*.example.com", // wildcard not in the leading label
                "learnnow.example.com" // no scheme
            })
    @DisplayName("wildcards that match hosts we do not control are refused")
    void refusesDangerousOrigins(String origin) {
        assertThrows(IllegalStateException.class, () -> validatorFor(origin).validate());
    }

    @Test
    @DisplayName("a JWT secret under 32 bytes refuses to boot")
    void refusesShortJwtSecret() {
        StartupConfigValidator v = validatorFor("https://app.example.com");
        ReflectionTestUtils.setField(v, "jwtSecret", "short");
        IllegalStateException ex = assertThrows(IllegalStateException.class, v::validate);
        assertTrue(ex.getMessage().contains("too short"));
    }

    private static MockEnvironment profile(String... profiles) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles(profiles);
        return env;
    }

    /**
     * These four cases are the ones CI caught and a local run could not: the integration suite
     * skips itself without Docker, so the test profile never actually booted the context here.
     */
    @Test
    @DisplayName("the payment mock is allowed under the test profile")
    void allowsPaymentMockUnderTestProfile() {
        StartupConfigValidator v = validatorFor("https://app.example.com", profile("test"));
        ReflectionTestUtils.setField(v, "paymentsMockEnabled", true);
        assertDoesNotThrow(v::validate);
    }

    @Test
    @DisplayName("the payment mock is allowed under the local profile")
    void allowsPaymentMockUnderLocalProfile() {
        StartupConfigValidator v = validatorFor("https://app.example.com", profile("local"));
        ReflectionTestUtils.setField(v, "paymentsMockEnabled", true);
        assertDoesNotThrow(v::validate);
    }

    @Test
    @DisplayName("the payment mock refuses to boot under the prod profile")
    void refusesPaymentMockUnderProdProfile() {
        StartupConfigValidator v = validatorFor("https://app.example.com", profile("prod"));
        ReflectionTestUtils.setField(v, "paymentsMockEnabled", true);
        IllegalStateException ex = assertThrows(IllegalStateException.class, v::validate);
        assertTrue(ex.getMessage().contains("mock-enabled"));
    }

    @Test
    @DisplayName("a placeholder Razorpay key refuses to boot under the prod profile")
    void refusesPlaceholderGatewayKeyInProd() {
        StartupConfigValidator v = validatorFor("https://app.example.com", profile("prod"));
        ReflectionTestUtils.setField(v, "razorpayKeyId", "rzp_test_placeholder");
        assertThrows(IllegalStateException.class, v::validate);
    }
}
