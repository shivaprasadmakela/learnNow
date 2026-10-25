package com.learnnow.trainer.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * What a learner is working towards. Every field is optional: a goal can be set a piece at a time.
 */
@Entity
@Table(name = "learner_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerGoal {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "target_role", length = 120)
    private String targetRole;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "hours_per_week")
    private Short hoursPerWeek;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
