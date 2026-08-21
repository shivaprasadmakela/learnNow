package com.learnnow.learningprogress.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Records that a user has answered a question.
 *
 * <p>Its only job is to make scoring first-attempt-only. Without it, points were awarded on every
 * correct submission, so replaying a single request farmed points without limit. The unique
 * constraint on (user_id, question_id) is what actually enforces this - an application-level check
 * alone would still lose the race between two concurrent submissions.
 */
@Entity
@Table(
        name = "user_quiz_attempts",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_quiz_attempt_user_question",
                        columnNames = {"user_id", "question_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserQuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "points_awarded", nullable = false)
    @Builder.Default
    private int pointsAwarded = 0;

    @Column(name = "attempted_at", nullable = false)
    @Builder.Default
    private Instant attemptedAt = Instant.now();
}
