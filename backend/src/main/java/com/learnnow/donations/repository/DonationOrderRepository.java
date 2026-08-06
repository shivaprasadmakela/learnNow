package com.learnnow.donations.repository;

import com.learnnow.donations.entity.DonationOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DonationOrderRepository extends JpaRepository<DonationOrder, UUID> {
    Optional<DonationOrder> findByOrderId(String orderId);
}
