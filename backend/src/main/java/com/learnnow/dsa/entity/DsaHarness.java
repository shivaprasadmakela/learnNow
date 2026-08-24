package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * What turns the learner's fragment into a program that can be run.
 *
 * <p>Two of these columns must never be serialised to a non-admin client: {@code driverCode} embeds
 * the whole I/O contract and often the shape of the answer, and {@code referenceSolution} is the
 * answer. The public DTOs have no field for either, so exposing one would take adding a field
 * rather than forgetting to strip it.
 */
@Entity
@Table(name = "dsa_harnesses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsaHarness {

    /** Marks the point in {@link #driverCode} where the learner's code is spliced in. */
    public static final String USER_CODE_PLACEHOLDER = "{{USER_CODE}}";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private DsaProblem problem;

    @Column(nullable = false, length = 24)
    private String language;

    /** The stub the editor shows. The only column here a learner ever sees. */
    @Column(name = "starter_code", columnDefinition = "TEXT", nullable = false)
    private String starterCode;

    @Column(name = "driver_code", columnDefinition = "TEXT", nullable = false)
    private String driverCode;

    @Column(name = "reference_solution", columnDefinition = "TEXT")
    private String referenceSolution;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
