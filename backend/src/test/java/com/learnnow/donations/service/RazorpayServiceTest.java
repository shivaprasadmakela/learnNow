package com.learnnow.donations.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnnow.donations.dto.request.PaymentVerificationRequest;
import com.learnnow.donations.entity.DonationOrder;
import com.learnnow.donations.repository.DonationOrderRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

/** Regression cover for the payment state-downgrade hole found in the audit. */
class RazorpayServiceTest {

    private static final String ORDER_ID = "order_abc123";

    private DonationOrderRepository repository;
    private RazorpayService service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(DonationOrderRepository.class);
        service = new RazorpayService(repository);
        // Mock disabled: exercise the real signature path.
        ReflectionTestUtils.setField(service, "mockEnabled", false);
        ReflectionTestUtils.setField(service, "keyId", "rzp_test_x");
        ReflectionTestUtils.setField(service, "keySecret", "secret");
    }

    @Test
    @DisplayName("a bogus signature cannot knock a completed order back to failed")
    void completedOrderIsNotDowngradedByAnInvalidSignature() {
        DonationOrder completed =
                DonationOrder.builder()
                        .orderId(ORDER_ID)
                        .amount(500)
                        .status("COMPLETED")
                        .paymentId("pay_real")
                        .build();
        when(repository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(completed));

        boolean result =
                service.verifyPayment(
                        new PaymentVerificationRequest(ORDER_ID, "pay_forged", "not-a-signature"));

        assertTrue(result, "an already-settled order stays settled");
        assertEquals("COMPLETED", completed.getStatus());
        assertEquals("pay_real", completed.getPaymentId());
        // Nothing is written: the endpoint is public, so an unauthenticated caller who
        // knew an order id could previously force it to FAILED.
        verify(repository, never()).save(Mockito.any());
    }

    @Test
    @DisplayName("a webhook whose amount does not match the order is ignored")
    void webhookWithMismatchedAmountIsRejected() {
        DonationOrder created =
                DonationOrder.builder().orderId(ORDER_ID).amount(500).status("CREATED").build();
        when(repository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(created));

        // Order is 500 INR = 50000 paise; the webhook claims 100 paise.
        service.settleFromWebhook(ORDER_ID, "pay_1", 100);

        assertEquals("CREATED", created.getStatus());
        verify(repository, never()).save(Mockito.any());
    }

    @Test
    @DisplayName("a webhook with the right amount settles the order")
    void webhookWithMatchingAmountSettlesTheOrder() {
        DonationOrder created =
                DonationOrder.builder().orderId(ORDER_ID).amount(500).status("CREATED").build();
        when(repository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(created));

        service.settleFromWebhook(ORDER_ID, "pay_1", 50000);

        assertEquals("COMPLETED", created.getStatus());
        assertEquals("pay_1", created.getPaymentId());
        verify(repository).save(created);
    }
}
