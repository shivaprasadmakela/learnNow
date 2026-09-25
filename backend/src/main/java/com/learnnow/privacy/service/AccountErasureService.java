package com.learnnow.privacy.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.donations.entity.DonationOrder;
import com.learnnow.donations.repository.DonationOrderRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The right to erasure, s.12(3).
 *
 * <p>Erasure here is a real delete, not a {@code deleted_at} column. A soft delete leaves the
 * personal data exactly where it was and relies on every future query remembering to filter it out,
 * which is a promise the schema cannot keep. V1 already cascades everything a learner owns from
 * their {@code users} row — progress, notes, bookmarks, submissions, consents, grievances, nominee
 * and every token — so the deletion is one statement and cannot miss a table that is added later,
 * provided that table cascades too.
 *
 * <p><b>Donations are the exception</b>, and it is a lawful one. s.8(7) suspends the duty to erase
 * where retention is required by law, and payment records are retained for tax and audit. Those
 * rows are not linked to the account by a foreign key at all — the donation form takes an email —
 * so they neither cascade nor should. Instead the donor's name, email and message are overwritten,
 * which keeps the financial record intact while removing what identifies a person. The amount, the
 * gateway reference and the timestamps are not personal data and stay.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AccountErasureService {

    /** Written over erased donor fields so a row is visibly anonymised rather than blank. */
    private static final String ERASED_MARKER = "[erased]";

    private final UserRepository userRepository;
    private final DonationOrderRepository donationOrderRepository;

    /**
     * Erases the account and everything cascading from it.
     *
     * <p>Donations are anonymised before the user row goes, because the donor email is the only
     * thing linking them and reading it afterwards would be impossible.
     */
    @Transactional
    public void eraseAccount(String userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new NotFoundException("user_not_found"));

        int anonymisedDonations = anonymiseDonations(user.getEmail());

        userRepository.delete(user);

        // Logged without the email or the account id: an erasure that leaves the erased identifier
        // in the application log has not erased much. The count is what operations needs.
        log.info(
                "Erased account under DPDP s.12; anonymised {} retained donation record(s)",
                anonymisedDonations);
    }

    private int anonymiseDonations(String email) {
        if (email == null || email.isBlank()) {
            return 0;
        }

        List<DonationOrder> donations = donationOrderRepository.findByDonorEmailIgnoreCase(email);
        for (DonationOrder donation : donations) {
            donation.setDonorName(ERASED_MARKER);
            donation.setDonorEmail(ERASED_MARKER);
            // Free text written by the donor, so it may contain anything about them.
            donation.setMessage(null);
        }
        donationOrderRepository.saveAll(donations);
        return donations.size();
    }
}
