package com.learnnow.donations.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.donations.dto.request.DonationRequest;
import com.learnnow.donations.dto.request.PaymentVerificationRequest;
import com.learnnow.donations.dto.response.DonationResponse;
import com.learnnow.donations.entity.DonationOrder;
import com.learnnow.donations.repository.DonationOrderRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Value("${spring.profiles.active:local}")
    private String activeProfile;

    private final DonationOrderRepository donationOrderRepository;

    public RazorpayService(DonationOrderRepository donationOrderRepository) {
        this.donationOrderRepository = donationOrderRepository;
    }

    @Transactional
    public DonationResponse createDonationOrder(DonationRequest request) throws RazorpayException {
        int amountInPaise = request.getAmount() * 100;
        String razorpayOrderId;

        // If placeholders are present in local dev mode, generate a mock order ID for testing UI
        if ("local".equalsIgnoreCase(activeProfile)
                && ("rzp_test_placeholder".equals(keyId) || keyId.isEmpty())) {
            log.warn(
                    "Using placeholder Razorpay Key ID in local profile. Generating mock order ID"
                            + " for testing UI.");
            razorpayOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 12);
        } else {
            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "coffee_" + System.currentTimeMillis());

            Order order = razorpay.orders.create(orderRequest);
            razorpayOrderId = order.get("id");
        }

        DonationOrder donationOrder =
                DonationOrder.builder()
                        .orderId(razorpayOrderId)
                        .amount(request.getAmount())
                        .currency("INR")
                        .status("CREATED")
                        .donorName(request.getDonorName())
                        .donorEmail(request.getDonorEmail())
                        .message(request.getMessage())
                        .build();

        donationOrderRepository.save(donationOrder);

        return DonationResponse.builder()
                .orderId(razorpayOrderId)
                .amount(request.getAmount())
                .amountInPaise(amountInPaise)
                .currency("INR")
                .keyId(keyId)
                .status("CREATED")
                .build();
    }

    @Transactional
    public boolean verifyPayment(PaymentVerificationRequest request) {
        log.info(
                "Verifying Razorpay payment signature for orderId: {}",
                request.getRazorpayOrderId());

        DonationOrder donationOrder =
                donationOrderRepository
                        .findByOrderId(request.getRazorpayOrderId())
                        .orElseThrow(() -> new NotFoundException("donation_order_not_found"));

        boolean isValidSignature = false;

        if ("local".equalsIgnoreCase(activeProfile)
                && ("rzp_test_placeholder".equals(keyId) || keyId.isEmpty())) {
            log.warn(
                    "Mock Razorpay mode active in local profile - auto verifying payment"
                            + " signature.");
            isValidSignature = true;
        } else {
            try {
                JSONObject attributes = new JSONObject();
                attributes.put("razorpay_order_id", request.getRazorpayOrderId());
                attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
                attributes.put("razorpay_signature", request.getRazorpaySignature());

                isValidSignature = Utils.verifyPaymentSignature(attributes, keySecret);
            } catch (Exception e) {
                log.error("Failed to verify Razorpay signature", e);
                isValidSignature = false;
            }
        }

        if (isValidSignature) {
            donationOrder.setStatus("COMPLETED");
            donationOrder.setPaymentId(request.getRazorpayPaymentId());
            donationOrder.setSignature(request.getRazorpaySignature());
            donationOrderRepository.save(donationOrder);
            return true;
        } else {
            donationOrder.setStatus("FAILED");
            donationOrderRepository.save(donationOrder);
            return false;
        }
    }
}
