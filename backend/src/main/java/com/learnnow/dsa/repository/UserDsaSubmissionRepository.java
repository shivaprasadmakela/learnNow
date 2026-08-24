package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.UserDsaSubmission;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDsaSubmissionRepository extends JpaRepository<UserDsaSubmission, UUID> {

    Page<UserDsaSubmission> findByUserIdAndProblemIdOrderByCreatedAtDesc(
            String userId, UUID problemId, Pageable pageable);
}
