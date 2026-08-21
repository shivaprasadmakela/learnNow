package com.learnnow.donations.controller;

import com.learnnow.donations.dto.request.DonationRequest;
import com.learnnow.donations.dto.request.PaymentVerificationRequest;
import com.learnnow.donations.dto.response.DonationResponse;
import com.learnnow.donations.service.RazorpayService;
import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final RazorpayService razorpayService;

    @PostMapping("/create-order")
    public ResponseEntity<DonationResponse> createOrder(@Valid @RequestBody DonationRequest request)
            throws RazorpayException {
        // Gateway failures propagate to the global handler, which logs them and returns a
        // 502 with a diagnosable code. Swallowing them here made an outage and a bad
        // request indistinguishable to the client.
        return ResponseEntity.ok(razorpayService.createDonationOrder(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@Valid @RequestBody PaymentVerificationRequest request) {
        boolean isVerified = razorpayService.verifyPayment(request);
        if (isVerified) {
            return ResponseEntity.ok(
                    Map.of("status", "SUCCESS", "message", "Thank you for buying a coffee! ☕"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "status",
                                    "FAILED",
                                    "message",
                                    "Payment verification failed. Invalid signature."));
        }
    }
}
