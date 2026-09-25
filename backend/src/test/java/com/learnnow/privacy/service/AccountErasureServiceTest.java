package com.learnnow.privacy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.donations.entity.DonationOrder;
import com.learnnow.donations.repository.DonationOrderRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/**
 * Erasure, and the one thing that deliberately survives it.
 *
 * <p>The cascade itself is the database's job and is covered by the schema; what is worth testing
 * here is the carve-out, because a future change that "tidies up" the donation handling would
 * either leak a donor's identity or destroy a financial record.
 */
class AccountErasureServiceTest {

    private static final String USER_ID = "user-1";

    private UserRepository userRepository;
    private DonationOrderRepository donationOrderRepository;
    private AccountErasureService erasureService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        donationOrderRepository = Mockito.mock(DonationOrderRepository.class);
        erasureService = new AccountErasureService(userRepository, donationOrderRepository);
    }

    private User learner() {
        return User.builder().id(USER_ID).email("asha@example.com").build();
    }

    @Test
    @DisplayName("deletes the account, which cascades everything owned by it")
    void deletesTheUserRow() {
        User user = learner();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(donationOrderRepository.findByDonorEmailIgnoreCase(anyString())).thenReturn(List.of());

        erasureService.eraseAccount(USER_ID);

        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("keeps the donation record but strips what identifies the donor")
    void anonymisesDonationsRatherThanDeletingThem() {
        DonationOrder donation =
                DonationOrder.builder()
                        .orderId("order_1")
                        .amount(500)
                        .status("COMPLETED")
                        .donorName("Asha Rao")
                        .donorEmail("asha@example.com")
                        .message("keep it up")
                        .build();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(learner()));
        when(donationOrderRepository.findByDonorEmailIgnoreCase("asha@example.com"))
                .thenReturn(List.of(donation));

        erasureService.eraseAccount(USER_ID);

        // s.8(7): the duty to erase yields to tax and audit retention, so the row stays...
        verify(donationOrderRepository, never()).delete(any());
        verify(donationOrderRepository).saveAll(any());
        assertThat(donation.getAmount()).isEqualTo(500);
        assertThat(donation.getOrderId()).isEqualTo("order_1");

        // ...but nothing on it points at a person any more. The message goes too: it is
        // free text the donor wrote, so it may say anything about them.
        assertThat(donation.getDonorName()).isEqualTo("[erased]");
        assertThat(donation.getDonorEmail()).isEqualTo("[erased]");
        assertThat(donation.getMessage()).isNull();
    }

    @Test
    @DisplayName(
            "matches donations case-insensitively, because the donation form does not normalise")
    void donationLookupIgnoresCase() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(learner()));
        when(donationOrderRepository.findByDonorEmailIgnoreCase(anyString())).thenReturn(List.of());

        erasureService.eraseAccount(USER_ID);

        verify(donationOrderRepository).findByDonorEmailIgnoreCase("asha@example.com");
    }

    @Test
    @DisplayName("erasing an account that is already gone is an error, not a silent success")
    void unknownAccountIsRejected() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> erasureService.eraseAccount(USER_ID))
                .isInstanceOf(NotFoundException.class);

        verify(donationOrderRepository, never()).saveAll(any());
    }
}
