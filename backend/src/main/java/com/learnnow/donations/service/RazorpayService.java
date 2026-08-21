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

    /**
     * When true, payment signatures are accepted without verification. Gated on its own explicit
     * flag rather than on the active profile name, so it cannot be switched on by a profile
     * defaulting unexpectedly in a deployed environment.
     */
    @Value("${app.payments.mock-enabled:false}")
    private boolean mockEnabled;

    private static final String STATUS_CREATED = "CREATED";
    private static final String STATUS_COMPLETED = "COMPLETED";

    private final DonationOrderRepository donationOrderRepository;

    public RazorpayService(DonationOrderRepository donationOrderRepository) {
        this.donationOrderRepository = donationOrderRepository;
    }

    @Transactional
    public DonationResponse createDonationOrder(DonationRequest request) throws RazorpayException {
        int amountInPaise = request.getAmount() * 100;
        String razorpayOrderId;

        // Mock mode lets the donation UI be exercised without real gateway credentials.
        if (mockEnabled) {
            log.warn(
                    "Payment mock enabled - generating a mock order id instead of calling"
                            + " Razorpay.");
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
                        .status(STATUS_CREATED)
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
                .status(STATUS_CREATED)
                .build();
    }

    @Transactional
    public boolean verifyPayment(PaymentVerificationRequest request) {
        DonationOrder donationOrder =
                donationOrderRepository
                        .findByOrderId(request.getRazorpayOrderId())
                        .orElseThrow(() -> new NotFoundException("donation_order_not_found"));

        // Idempotency: a repeated callback for an order that is already settled is a no-op.
        // This also closes the downgrade hole - without it, an unauthenticated caller who knows
        // an order id could post a junk signature and overwrite a genuinely completed payment.
        if (STATUS_COMPLETED.equals(donationOrder.getStatus())) {
            log.info(
                    "Ignoring repeat verification for already-completed order {}",
                    request.getRazorpayOrderId());
            return true;
        }

        boolean isValidSignature = verifySignature(request);

        if (isValidSignature) {
            donationOrder.setStatus(STATUS_COMPLETED);
            donationOrder.setPaymentId(request.getRazorpayPaymentId());
            donationOrder.setSignature(request.getRazorpaySignature());
            donationOrderRepository.save(donationOrder);
            log.info("Payment verified for order {}", request.getRazorpayOrderId());
            return true;
        }

        // A failed signature is recorded but never overwrites a settled order (guarded above),
        // and never blocks a later legitimate attempt for an order still in progress.
        log.warn("Signature verification failed for order {}", request.getRazorpayOrderId());
        return false;
    }

    private boolean verifySignature(PaymentVerificationRequest request) {
        if (mockEnabled) {
            log.warn("Payment mock enabled - accepting payment signature without verification.");
            return true;
        }
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", request.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
            attributes.put("razorpay_signature", request.getRazorpaySignature());
            return Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (Exception e) {
            log.error("Failed to verify Razorpay signature", e);
            return false;
        }
    }

    /**
     * Settles an order from a verified Razorpay webhook. The webhook is the authoritative signal:
     * unlike the browser callback it still arrives when the user closes the tab mid-checkout.
     */
    @Transactional
    public void settleFromWebhook(String orderId, String paymentId, int amountPaise) {
        DonationOrder order = donationOrderRepository.findByOrderId(orderId).orElse(null);
        if (order == null) {
            log.warn("Webhook referenced unknown order {}", orderId);
            return;
        }
        if (STATUS_COMPLETED.equals(order.getStatus())) {
            return;
        }
        int expectedPaise = order.getAmount() * 100;
        if (amountPaise != expectedPaise) {
            log.error(
                    "Webhook amount mismatch for order {}: captured {} paise, expected {} paise",
                    orderId,
                    amountPaise,
                    expectedPaise);
            return;
        }
        order.setStatus(STATUS_COMPLETED);
        order.setPaymentId(paymentId);
        donationOrderRepository.save(order);
        log.info("Order {} settled from webhook", orderId);
    }
}
