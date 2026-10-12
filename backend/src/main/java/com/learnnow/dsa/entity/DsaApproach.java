package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "dsa_approaches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsaApproach {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private DsaProblem problem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    @Builder.Default
    private DsaApproachKind kind = DsaApproachKind.OPTIMAL;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(columnDefinition = "TEXT", nullable = false)
    @Builder.Default
    private String intuition = "";

    @Column(name = "time_complexity", length = 64)
    private String timeComplexity;

    @Column(name = "space_complexity", length = 64)
    private String spaceComplexity;

    /**
     * The approach's code in every language it is written in, as a JSON array of {@code {language,
     * code}} objects. Read and written through {@code DsaApproachSolutions}, which normalises the
     * language ids and keeps the order stable.
     *
     * <p>See the note on {@code DsaProblem.tags}: without {@code @JdbcTypeCode} the varchar binding
     * is rejected.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB", nullable = false)
    @Builder.Default
    private String solutions = "[]";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
