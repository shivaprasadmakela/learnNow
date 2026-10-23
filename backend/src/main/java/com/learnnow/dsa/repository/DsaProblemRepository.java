package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaDifficulty;
import com.learnnow.dsa.entity.DsaProblem;
import com.learnnow.dsa.entity.DsaProblemStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DsaProblemRepository extends JpaRepository<DsaProblem, UUID> {

    Optional<DsaProblem> findBySlug(String slug);

    Optional<DsaProblem> findBySlugAndStatus(String slug, DsaProblemStatus status);

    /**
     * One page of a step's problems, ordered by section then position.
     *
     * <p>The ordering is spelled out because pagination over an unordered result repeats rows on
     * page two and skips others entirely.
     */
    @Query(
            value =
                    "SELECT p FROM DsaProblem p WHERE p.section.step.id = :stepId"
                            + " AND p.status = :status"
                            + " ORDER BY p.section.orderIndex ASC, p.orderIndex ASC",
            countQuery =
                    "SELECT COUNT(p) FROM DsaProblem p WHERE p.section.step.id = :stepId"
                            + " AND p.status = :status")
    Page<DsaProblem> findByStepIdAndStatus(
            @Param("stepId") UUID stepId,
            @Param("status") DsaProblemStatus status,
            Pageable pageable);

    /** A problem's id and slug, which is all the previous/next stepper needs of a sibling. */
    interface SlugRef {
        UUID getId();

        String getSlug();
    }

    /**
     * A step's problems in the stepper's order, as ids and slugs only.
     *
     * <p>Loading the entities to find two neighbouring slugs pulled every sibling's statement along
     * with it - tens of full rows to read two short strings.
     */
    @Query(
            "SELECT p.id AS id, p.slug AS slug FROM DsaProblem p"
                    + " WHERE p.section.step.id = :stepId AND p.status = :status"
                    + " ORDER BY p.section.orderIndex ASC, p.orderIndex ASC")
    List<SlugRef> findSlugsByStepIdAndStatus(
            @Param("stepId") UUID stepId, @Param("status") DsaProblemStatus status);

    @Query(
            "SELECT COUNT(p) FROM DsaProblem p WHERE p.section.step.sheet.id = :sheetId"
                    + " AND p.status = :status")
    long countBySheetIdAndStatus(
            @Param("sheetId") UUID sheetId, @Param("status") DsaProblemStatus status);

    @Query(
            "SELECT p.difficulty, COUNT(p) FROM DsaProblem p"
                    + " WHERE p.section.step.sheet.id = :sheetId AND p.status = :status"
                    + " GROUP BY p.difficulty")
    List<Object[]> countBySheetIdGroupedByDifficulty(
            @Param("sheetId") UUID sheetId, @Param("status") DsaProblemStatus status);

    @Query("SELECT p.difficulty FROM DsaProblem p WHERE p.id = :id")
    Optional<DsaDifficulty> findDifficultyById(@Param("id") UUID id);

    @Query("SELECT p.section.step.id FROM DsaProblem p WHERE p.id = :id")
    Optional<UUID> findStepIdByProblemId(@Param("id") UUID id);

    @Query("SELECT p.section.step.sheet.id FROM DsaProblem p WHERE p.id = :id")
    Optional<UUID> findSheetIdByProblemId(@Param("id") UUID id);

    /**
     * The given problems with their section and step, in one query. Order is not preserved; the
     * caller already has the order it wants.
     */
    @Query(
            "SELECT p FROM DsaProblem p JOIN FETCH p.section s JOIN FETCH s.step"
                    + " WHERE p.id IN :ids")
    List<DsaProblem> findAllWithSectionByIdIn(@Param("ids") Collection<UUID> ids);

    /** What a list row shows of a problem and where it lives - no statement, no editorial. */
    interface ProblemHeader {
        UUID getId();

        String getSlug();

        String getTitle();

        DsaDifficulty getDifficulty();

        String getStepSlug();

        String getStepTitle();
    }

    /** Headers of the published problems among some ids; drafts and unknown ids have no row. */
    @Query(
            "SELECT p.id AS id, p.slug AS slug, p.title AS title, p.difficulty AS difficulty,"
                    + " st.slug AS stepSlug, st.title AS stepTitle"
                    + " FROM DsaProblem p JOIN p.section sec JOIN sec.step st"
                    + " WHERE p.id IN :ids"
                    + " AND p.status = com.learnnow.dsa.entity.DsaProblemStatus.PUBLISHED")
    List<ProblemHeader> findPublishedHeadersByIdIn(@Param("ids") Collection<UUID> ids);

    @Query("SELECT p FROM DsaProblem p WHERE p.slug IN :slugs")
    List<DsaProblem> findAllBySlugIn(@Param("slugs") List<String> slugs);
}
