package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaStep;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DsaStepRepository extends JpaRepository<DsaStep, UUID> {

    List<DsaStep> findBySheetIdOrderByOrderIndexAsc(UUID sheetId);

    Optional<DsaStep> findBySheetIdAndSlug(UUID sheetId, String slug);

    /**
     * Total published problems per step, in one query.
     *
     * <p>The sheet page shows solved/total for every step at once. Counting per step in a loop is
     * the N+1 the course catalogue already suffers from; this is the reason it does not happen
     * here.
     */
    @Query(
            "SELECT s.id, COUNT(p) FROM DsaStep s"
                    + " LEFT JOIN DsaSection sec ON sec.step = s"
                    + " LEFT JOIN DsaProblem p ON p.section = sec AND p.status = 'PUBLISHED'"
                    + " WHERE s.sheet.id = :sheetId GROUP BY s.id")
    List<Object[]> countPublishedProblemsPerStep(@Param("sheetId") UUID sheetId);
}
