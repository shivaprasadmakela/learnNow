package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaDifficulty;
import com.learnnow.dsa.entity.DsaProblem;
import com.learnnow.dsa.entity.DsaProblemStatus;
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

    @Query(
            "SELECT p FROM DsaProblem p WHERE p.section.step.id = :stepId AND p.status = :status"
                    + " ORDER BY p.section.orderIndex ASC, p.orderIndex ASC")
    List<DsaProblem> findAllByStepIdAndStatus(
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

    @Query("SELECT p FROM DsaProblem p WHERE p.slug IN :slugs")
    List<DsaProblem> findAllBySlugIn(@Param("slugs") List<String> slugs);
}
