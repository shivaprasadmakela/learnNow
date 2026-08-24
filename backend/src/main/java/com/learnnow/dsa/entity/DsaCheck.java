package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/** The inline "now your turn" question inside a statement. */
@Entity
@Table(name = "dsa_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsaCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private DsaProblem problem;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private int orderIndex = 1;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    /** See the note on {@code DsaProblem.tags}: without this the varchar binding is rejected. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB", nullable = false)
    @Builder.Default
    private String options = "[]";

    /**
     * Stripped from every learner-facing response and compared server-side, the same rule the
     * subtopic quiz already follows.
     */
    @Column(name = "correct_answer", nullable = false, length = 512)
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    @Builder.Default
    private int points = 2;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
