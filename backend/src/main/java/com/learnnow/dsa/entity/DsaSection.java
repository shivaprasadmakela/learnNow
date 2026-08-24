package com.learnnow.dsa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * A grouping level inside a step, nestable to any depth.
 *
 * <p>May hold problems, sub-sections, or both. A step whose problems all sit in one untitled root
 * section renders flat, which is what makes the level optional rather than mandatory.
 */
@Entity
@Table(name = "dsa_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsaSection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "step_id", nullable = false)
    private DsaStep step;

    /** Null for a top-level section. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_section_id")
    private DsaSection parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<DsaSection> children = new ArrayList<>();

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    /** Zero at the top level. Stored so the UI can indent without walking the parent chain. */
    @Column(nullable = false)
    @Builder.Default
    private int depth = 0;

    /**
     * Ancestor order indexes, zero-padded and dot-joined: {@code 003.001.002}.
     *
     * <p>Sorting by this string is tree order, which is what lets a paginated problem list come
     * back correctly grouped without a recursive query on every page.
     */
    @Column(nullable = false, length = 255)
    @Builder.Default
    private String path = "";

    /** Null for the single implicit section of a flat step. */
    private String title;

    @Column(length = 1000)
    private String description;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<DsaProblem> problems = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
