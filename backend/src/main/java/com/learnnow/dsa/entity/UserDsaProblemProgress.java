package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
        name = "user_dsa_problem_progress",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "problem_id"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDsaProblemProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "problem_id", nullable = false)
    private UUID problemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private DsaProgressStatus status = DsaProgressStatus.NOT_STARTED;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 0;

    @Column(name = "last_language", length = 24)
    private String lastLanguage;

    /**
     * Also the once-ever points guard: points are awarded only on the transition away from null, so
     * re-submitting an accepted solution records the submission and awards nothing.
     */
    @Column(name = "solved_at")
    private Instant solvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
