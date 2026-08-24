package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.UserDsaProblemProgress;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserDsaProblemProgressRepository
        extends JpaRepository<UserDsaProblemProgress, UUID> {

    Optional<UserDsaProblemProgress> findByUserIdAndProblemId(String userId, UUID problemId);

    List<UserDsaProblemProgress> findByUserIdAndProblemIdIn(String userId, List<UUID> problemIds);

    @Query(
            "SELECT COUNT(pr) FROM UserDsaProblemProgress pr, DsaProblem p"
                    + " WHERE pr.problemId = p.id AND pr.userId = :userId"
                    + " AND pr.status = 'SOLVED' AND p.status = 'PUBLISHED'"
                    + " AND p.section.step.id = :stepId")
    long countSolvedByUserIdAndStepId(@Param("userId") String userId, @Param("stepId") UUID stepId);
}
