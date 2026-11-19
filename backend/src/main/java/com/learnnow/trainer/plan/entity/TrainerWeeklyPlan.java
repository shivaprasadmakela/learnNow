package com.learnnow.trainer.plan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * The AI's study plan for one learner's week, Monday to Sunday in their time zone. Regenerating
 * replaces the plan and counts towards the weekly refresh limit.
 */
@Entity
@Table(name = "trainer_weekly_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainerWeeklyPlan {

    @Id private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    /** learnnow-ai's plan as it returned it: headline, focus, days, advice, total_minutes. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> plan;

    @Column(nullable = false)
    @Builder.Default
    private int generations = 1;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
