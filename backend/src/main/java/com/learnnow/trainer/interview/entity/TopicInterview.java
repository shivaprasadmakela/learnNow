package com.learnnow.trainer.interview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "topic_interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicInterview {

    @Id private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    /** Null for mock interviews, which are about a role rather than one topic. */
    @Column(name = "topic_id")
    private UUID topicId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InterviewKind kind = InterviewKind.TOPIC;

    @Column(length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InterviewStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> plan;

    @Column(length = 80)
    private String room;

    @Column(name = "overall_score")
    private Integer overallScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> habits;

    @Column(name = "points_awarded", nullable = false)
    @Builder.Default
    private int pointsAwarded = 0;

    @Column(name = "cost_inr", precision = 8, scale = 2)
    private BigDecimal costInr;

    @Column(name = "ended_reason", length = 40)
    private String endedReason;

    /** dimensions, strengths, improvements and next_step from scoring. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> feedback;

    /** 1 when the learner found the evaluation fair, -1 when not. */
    @Column(name = "learner_rating")
    private Short learnerRating;

    @Column(name = "learner_comment", length = 500)
    private String learnerComment;

    /** For a retry, the interview whose question it asks again. */
    @Column(name = "parent_interview_id")
    private UUID parentInterviewId;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
