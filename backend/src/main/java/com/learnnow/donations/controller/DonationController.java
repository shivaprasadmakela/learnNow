package com.learnnow.donations.controller;

import com.learnnow.donations.dto.request.DonationRequest;
import com.learnnow.donations.dto.response.DonationResponse;
import com.learnnow.donations.dto.request.PaymentVerificationRequest;
import com.learnnow.donations.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final RazorpayService razorpayService;

    @PostMapping("/create-order")
    public ResponseEntity<DonationResponse> createOrder(@Valid @RequestBody DonationRequest request) {
        try {
            DonationResponse response = razorpayService.createDonationOrder(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating donation order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@Valid @RequestBody PaymentVerificationRequest request) {
        boolean isVerified = razorpayService.verifyPayment(request);
        if (isVerified) {
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Thank you for buying a coffee! ☕"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "FAILED", "message", "Payment verification failed. Invalid signature."));
        }
    }
}
