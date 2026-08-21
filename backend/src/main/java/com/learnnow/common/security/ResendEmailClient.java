package com.learnnow.common.security;

import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class ResendEmailClient {

    private final RestClient restClient;

    @Value("${resend.from-address}")
    private String fromAddress;

    public ResendEmailClient(
            @Value("${resend.api-key}") String apiKey, RestClient.Builder builder) {
        // The injected builder carries the connect/read timeouts from HttpClientConfig.
        this.restClient =
                builder.baseUrl("https://api.resend.com")
                        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .build();
    }

    /**
     * Escapes a value for interpolation into an HTML email body.
     *
     * <p>Names reach these templates straight from the registration form. Splicing them in raw let
     * anyone put arbitrary markup - including links - into a message sent from our own verified
     * sending domain, which is a phishing primitive that borrows our sender reputation.
     */
    private static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    @Async
    public void sendVerificationEmail(String toEmail, String firstName, String verifyLink) {
        Map<String, Object> body =
                Map.of(
                        "from",
                        "Learn Portal <" + fromAddress + ">",
                        "to",
                        List.of(toEmail),
                        "subject",
                        "Verify your learnNow account",
                        "html",
                        buildVerificationHtml(firstName, verifyLink));

        try {
            restClient.post().uri("/emails").body(body).retrieve().toBodilessEntity();
            log.info("Verification email dispatched to {}", maskEmail(toEmail));
        } catch (Exception e) {
            // Registration has already committed by this point, so a delivery failure must not
            // surface as a registration failure. The user can request a resend.
            log.error("Failed to send verification email to {}", maskEmail(toEmail), e);
        }
    }

    /** Avoids writing full addresses into logs. */
    private static String maskEmail(String email) {
        if (email == null) {
            return "unknown";
        }
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***" + (at >= 0 ? email.substring(at) : "");
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    private String buildVerificationHtml(String firstName, String link) {
        return """
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #1e293b;">Verify your learnNow account</h2>
            <p>Hi %s,</p>
            <p>Thank you for registering at learnNow! Click below to verify your email and complete your profile setup:</p>
            <p style="margin: 24px 0;">
                <a href="%s" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify my email</a>
            </p>
            <p>This verification link will expire in 24 hours.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #64748b;">If you did not request this registration, you can ignore this email.</p>
        </div>
        """
                .formatted(escapeHtml(firstName), escapeHtml(link));
    }

    /**
     * Sent when someone tries to register an address that already has an account. The registration
     * endpoint deliberately returns success in that case so it cannot be used to enumerate
     * accounts, which means email is the only place the real owner can be told.
     */
    @Async
    public void sendAccountExistsEmail(String toEmail, String firstName) {
        String body =
                """
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1e293b;">You already have a learnNow account</h2>
                    <p>Hi %s,</p>
                    <p>Someone just tried to create an account with this email address. You already
                       have one, so nothing has changed.</p>
                    <p>If that was you, sign in as usual. If you have forgotten your password, use
                       the "Forgot password" link on the sign-in page.</p>
                    <p style="font-size: 12px; color: #64748b;">If this was not you, you can safely
                       ignore this message.</p>
                </div>
                """
                        .formatted(escapeHtml(firstName));
        send(toEmail, "About your learnNow account", body);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String resetLink) {
        String body =
                """
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #1e293b;">Reset your learnNow password</h2>
                    <p>Hi %s,</p>
                    <p>Use the button below to choose a new password. This link expires in one hour
                       and can be used once.</p>
                    <p style="margin: 24px 0;">
                        <a href="%s" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Choose a new password</a>
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #64748b;">If you did not ask to reset your
                       password, ignore this email - your password will not change. Resetting also
                       signs you out everywhere.</p>
                </div>
                """
                        .formatted(escapeHtml(firstName), escapeHtml(resetLink));
        send(toEmail, "Reset your learnNow password", body);
    }

    /** Single send path so every message gets the same error handling and log masking. */
    private void send(String toEmail, String subject, String html) {
        Map<String, Object> body =
                Map.of(
                        "from",
                        "Learn Portal <" + fromAddress + ">",
                        "to",
                        List.of(toEmail),
                        "subject",
                        subject,
                        "html",
                        html);
        try {
            restClient.post().uri("/emails").body(body).retrieve().toBodilessEntity();
            log.info("Email '{}' dispatched to {}", subject, maskEmail(toEmail));
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}", subject, maskEmail(toEmail), e);
        }
    }
}
