package com.learnnow.common.config;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * The privacy contact must be real before the application will serve a privacy notice.
 *
 * <p>DPDP s.8(9) requires the contact for personal data questions to be published, and the notice
 * publishes whatever is configured. Booting with the placeholders would put an unread address on a
 * page promising a reply — and a learner may only escalate to the Data Protection Board after
 * exhausting a grievance route that, in that state, does not exist.
 */
class PrivacyContactValidationTest {

    private static final String DUMMY_SECRET = "not-a-secret-".repeat(4);

    private StartupConfigValidator validatorFor(String officerEmail, String officerAddress) {
        StartupConfigValidator v = new StartupConfigValidator(new MockEnvironment());
        ReflectionTestUtils.setField(v, "jwtSecret", DUMMY_SECRET);
        ReflectionTestUtils.setField(v, "allowedOrigins", "https://learnnow.example.com");
        ReflectionTestUtils.setField(v, "googleClientId", "client-id.apps.googleusercontent.com");
        ReflectionTestUtils.setField(v, "razorpayKeyId", "rzp_test_x");
        ReflectionTestUtils.setField(v, "paymentsMockEnabled", false);
        ReflectionTestUtils.setField(v, "grievanceOfficerEmail", officerEmail);
        ReflectionTestUtils.setField(v, "grievanceOfficerAddress", officerAddress);
        return v;
    }

    @Test
    @DisplayName("a real contact boots")
    void realContactIsAccepted() {
        assertDoesNotThrow(
                () -> validatorFor("privacy@learnnow.in", "1 Example Road, Bengaluru").validate());
    }

    @Test
    @DisplayName("the placeholder email refuses to boot outside local and test")
    void placeholderEmailIsRejected() {
        IllegalStateException thrown =
                assertThrows(
                        IllegalStateException.class,
                        () -> validatorFor("placeholder@example.com", "1 Example Road").validate());
        assertTrue(thrown.getMessage().contains("GRIEVANCE_OFFICER_EMAIL"));
    }

    @Test
    @DisplayName("an unset email refuses to boot")
    void blankEmailIsRejected() {
        assertThrows(
                IllegalStateException.class, () -> validatorFor("  ", "1 Example Road").validate());
    }

    @Test
    @DisplayName("the placeholder address refuses to boot")
    void placeholderAddressIsRejected() {
        IllegalStateException thrown =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                validatorFor("privacy@learnnow.in", "Address not configured")
                                        .validate());
        assertTrue(thrown.getMessage().contains("GRIEVANCE_OFFICER_ADDRESS"));
    }

    @Test
    @DisplayName("local development keeps the placeholders, because that is what they are for")
    void localProfileSkipsTheCheck() {
        MockEnvironment local = new MockEnvironment();
        local.setActiveProfiles("local");

        StartupConfigValidator v = new StartupConfigValidator(local);
        ReflectionTestUtils.setField(v, "jwtSecret", DUMMY_SECRET);
        ReflectionTestUtils.setField(v, "allowedOrigins", "http://localhost:5173");
        ReflectionTestUtils.setField(v, "googleClientId", "client-id.apps.googleusercontent.com");
        ReflectionTestUtils.setField(v, "razorpayKeyId", "rzp_test_placeholder");
        ReflectionTestUtils.setField(v, "paymentsMockEnabled", true);
        ReflectionTestUtils.setField(v, "grievanceOfficerEmail", "placeholder@example.com");
        ReflectionTestUtils.setField(v, "grievanceOfficerAddress", "Address not configured");

        assertDoesNotThrow(v::validate);
    }
}
