package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "dsa_problems")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsaProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private DsaSection section;

    /**
     * Stable import key. Matching on this is what lets a step be re-imported - with a video URL
     * filled in, say - without orphaning anybody's progress.
     */
    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(nullable = false)
    private String title;

    /** Markdown, written by us. Third-party problem statements are not ours to copy. */
    @Column(columnDefinition = "TEXT", nullable = false)
    @Builder.Default
    private String statement = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    @Builder.Default
    private DsaDifficulty difficulty = DsaDifficulty.EASY;

    /**
     * {@code @JdbcTypeCode} is load-bearing, not decoration. {@code columnDefinition} only affects
     * DDL generation, so without it the driver binds this String as varchar and Postgres rejects it
     * with "column tags is of type jsonb but expression is of type character varying".
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB", nullable = false)
    @Builder.Default
    private String tags = "[]";

    @Column(name = "estimated_minutes", nullable = false)
    @Builder.Default
    private int estimatedMinutes = 20;

    @Column(name = "youtube_url", length = 512)
    private String youtubeUrl;

    /** One-based index in the sheet playlist, for the "watch on the channel" deep link. */
    @Column(name = "youtube_position")
    private Integer youtubePosition;

    @Column(name = "practice_url", length = 512)
    private String practiceUrl;

    @Column(name = "practice_platform", length = 32)
    private String practicePlatform;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private DsaProblemStatus status = DsaProblemStatus.DRAFT;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<DsaApproach> approaches = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<DsaHint> hints = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DsaHarness> harnesses = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<DsaTestCase> testCases = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<DsaCheck> checks = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
