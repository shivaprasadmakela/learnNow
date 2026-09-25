package com.learnnow.privacy.repository;

import com.learnnow.privacy.entity.Grievance;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrievanceRepository extends JpaRepository<Grievance, UUID> {

    List<Grievance> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<Grievance> findByUserIdAndReference(String userId, String reference);

    /** Drives the per-year sequence in the human-readable reference. */
    long countByReferenceStartingWith(String prefix);
}
