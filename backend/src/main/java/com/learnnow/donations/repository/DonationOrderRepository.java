package com.learnnow.donations.repository;

import com.learnnow.donations.entity.DonationOrder;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DonationOrderRepository extends JpaRepository<DonationOrder, UUID> {
    Optional<DonationOrder> findByOrderId(String orderId);

    /**
     * Donations are keyed by the email typed into the donation form, not by account, so this is how
     * an erasure finds the rows whose donor name and email have to be overwritten. Matched case
     * insensitively because the form does not normalise what is typed into it.
     */
    List<DonationOrder> findByDonorEmailIgnoreCase(String donorEmail);
}
