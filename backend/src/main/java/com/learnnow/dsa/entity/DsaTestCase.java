package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "dsa_test_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsaTestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private DsaProblem problem;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String input;

    /** Empty until the reference solution has generated it. */
    @Column(name = "expected_output", columnDefinition = "TEXT", nullable = false)
    @Builder.Default
    private String expectedOutput = "";

    /**
     * Sample cases are public: they render as the Examples in the statement and are the only ones
     * Run executes. Everything else, including its expected output, is admin-only.
     */
    @Column(name = "is_sample", nullable = false)
    @Builder.Default
    private boolean sample = false;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
