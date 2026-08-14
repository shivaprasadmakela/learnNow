package com.learnnow.donations.repository;

import com.learnnow.donations.entity.DonationOrder;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DonationOrderRepository extends JpaRepository<DonationOrder, UUID> {
    Optional<DonationOrder> findByOrderId(String orderId);
}
