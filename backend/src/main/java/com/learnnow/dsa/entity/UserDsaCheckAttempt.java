package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

/**
 * Records that a learner has answered an inline check.
 *
 * <p>Its only job is to make check scoring first-attempt-only, the rule {@code user_quiz_attempts}
 * already enforces for the subtopic quiz. Rows are written by {@code
 * UserDsaCheckAttemptRepository.insertIfAbsent}, never through {@code save}: the unique constraint
 * on (user_id, check_id) settles a race between two concurrent first answers, and an insert that
 * yields to it is how the loser learns it lost without poisoning the transaction.
 */
@Entity
@Table(
        name = "user_dsa_check_attempts",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_dsa_check_attempt_user_check",
                        columnNames = {"user_id", "check_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDsaCheckAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "check_id", nullable = false)
    private UUID checkId;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "points_awarded", nullable = false)
    @Builder.Default
    private int pointsAwarded = 0;

    @Column(name = "attempted_at", nullable = false)
    @Builder.Default
    private Instant attemptedAt = Instant.now();
}
