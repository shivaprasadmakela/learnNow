package com.learnnow.donations.controller;

import com.learnnow.donations.service.RazorpayService;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authoritative payment settlement.
 *
 * <p>The browser callback to {@code /api/donations/verify} is best-effort: it never arrives if the
 * user closes the tab after paying, which previously left money captured by Razorpay and the order
 * stuck at CREATED forever. This webhook is the signal that always arrives.
 *
 * <p>The raw request body is required verbatim for signature verification, so it is taken as a
 * String rather than a parsed DTO.
 */
@Slf4j
@RestController
@RequestMapping("/api/donations/webhook")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    private static final String EVENT_PAYMENT_CAPTURED = "payment.captured";

    private final RazorpayService razorpayService;

    @Value("${razorpay.webhook.secret:}")
    private String webhookSecret;

    @PostMapping
    public ResponseEntity<Void> handle(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        if (signature == null || signature.isBlank()) {
            log.warn("Razorpay webhook rejected: missing signature header.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            if (!Utils.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
                log.warn("Razorpay webhook rejected: invalid signature.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        } catch (Exception e) {
            log.warn("Razorpay webhook signature verification failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            JSONObject payload = new JSONObject(rawBody);
            String event = payload.optString("event");
            if (!EVENT_PAYMENT_CAPTURED.equals(event)) {
                // Acknowledge everything else so Razorpay stops retrying.
                return ResponseEntity.ok().build();
            }

            JSONObject entity =
                    payload.getJSONObject("payload")
                            .getJSONObject("payment")
                            .getJSONObject("entity");
            razorpayService.settleFromWebhook(
                    entity.getString("order_id"), entity.getString("id"), entity.getInt("amount"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // A malformed payload is not worth retrying; log it and acknowledge.
            log.error("Failed to process Razorpay webhook payload", e);
            return ResponseEntity.ok().build();
        }
    }
}
