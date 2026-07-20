package com.learnnow.common.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class ResendEmailClient {

    private final RestClient restClient;

    @Value("${resend.from-address:onboarding@resend.dev}")
    private String fromAddress;

    public ResendEmailClient(@Value("${resend.api-key:placeholder}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public void sendVerificationEmail(String toEmail, String firstName, String verifyLink) {
        Map<String, Object> body = Map.of(
                "from", "Learn Portal <" + fromAddress + ">",
                "to", List.of(toEmail),
                "subject", "Verify your learnNow account",
                "html", buildVerificationHtml(firstName, verifyLink)
        );

        try {
            restClient.post()
                    .uri("/emails")
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            System.err.println("Failed to send email via Resend: " + e.getMessage());
            // Catch error but don't crash registration for local testing if API key is invalid/missing
        }
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
                """.formatted(firstName, link);
    }
}
