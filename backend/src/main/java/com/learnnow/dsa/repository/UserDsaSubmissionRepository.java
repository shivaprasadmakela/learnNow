package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.UserDsaSubmission;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDsaSubmissionRepository extends JpaRepository<UserDsaSubmission, UUID> {

    Page<UserDsaSubmission> findByUserIdAndProblemIdOrderByCreatedAtDesc(
            String userId, UUID problemId, Pageable pageable);

    /**
     * Every submission this learner has made, newest first. Unpaged on purpose: its one caller is
     * the DPDP data export (s.11), which has to return all of it or it is not an export.
     */
    List<UserDsaSubmission> findByUserIdOrderByCreatedAtDesc(String userId);
}
