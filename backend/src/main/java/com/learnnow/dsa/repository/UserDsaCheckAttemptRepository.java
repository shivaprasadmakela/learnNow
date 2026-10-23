package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.UserDsaCheckAttempt;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserDsaCheckAttemptRepository extends JpaRepository<UserDsaCheckAttempt, UUID> {

    /**
     * Records the first attempt, or does nothing if there already is one.
     *
     * <p>Returns 1 when this call recorded the attempt and 0 when an earlier one exists. The quiz
     * does the same with a save and a caught {@code DataIntegrityViolationException}, but inside a
     * transaction that exception marks it rollback-only, so the losing request of a race fails at
     * commit instead of being answered. Letting Postgres resolve the conflict avoids that and is
     * one round trip rather than a read followed by a write.
     */
    @Modifying
    @Query(
            value =
                    "INSERT INTO user_dsa_check_attempts"
                            + " (user_id, check_id, is_correct, points_awarded)"
                            + " VALUES (:userId, :checkId, :correct, :points)"
                            + " ON CONFLICT (user_id, check_id) DO NOTHING",
            nativeQuery = true)
    int insertIfAbsent(
            @Param("userId") String userId,
            @Param("checkId") UUID checkId,
            @Param("correct") boolean correct,
            @Param("points") int points);

    /** Every check this learner has answered. Used by the DPDP data export (s.11). */
    List<UserDsaCheckAttempt> findByUserId(String userId);
}
