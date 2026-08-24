package com.learnnow.dsa.dao;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Aggregate progress counts.
 *
 * <p>The sheet page shows solved-of-total for every step at once. The course catalogue's equivalent
 * ({@code CatalogService.getAllPaths}) reloads a user's whole progress set once per path, so ten
 * paths cost twenty redundant queries. Everything here is grouped in a single statement instead,
 * and that is the entire reason this class exists rather than a loop in the service.
 */
@Repository
public class DsaProgressDao {

    @PersistenceContext private EntityManager entityManager;

    /** Solved count per step for one learner and one sheet, in one query. */
    public Map<UUID, Long> solvedCountPerStep(String userId, UUID sheetId) {
        if (userId == null || userId.isBlank()) {
            return Map.of();
        }

        List<Object[]> rows =
                entityManager
                        .createQuery(
                                "SELECT p.section.step.id, COUNT(p) FROM DsaProblem p,"
                                        + " UserDsaProblemProgress pr"
                                        + " WHERE pr.problemId = p.id AND pr.userId = :userId"
                                        + " AND pr.status = 'SOLVED' AND p.status = 'PUBLISHED'"
                                        + " AND p.section.step.sheet.id = :sheetId"
                                        + " GROUP BY p.section.step.id",
                                Object[].class)
                        .setParameter("userId", userId)
                        .setParameter("sheetId", sheetId)
                        .getResultList();

        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    /** Published problem count per step, in one query. */
    public Map<UUID, Long> totalCountPerStep(UUID sheetId) {
        List<Object[]> rows =
                entityManager
                        .createQuery(
                                "SELECT p.section.step.id, COUNT(p) FROM DsaProblem p"
                                        + " WHERE p.status = 'PUBLISHED'"
                                        + " AND p.section.step.sheet.id = :sheetId"
                                        + " GROUP BY p.section.step.id",
                                Object[].class)
                        .setParameter("sheetId", sheetId)
                        .getResultList();

        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    /** Solved count per difficulty for one learner and one sheet, for the dashboard tile. */
    public Map<String, Long> solvedCountPerDifficulty(String userId, UUID sheetId) {
        if (userId == null || userId.isBlank()) {
            return Map.of();
        }

        List<Object[]> rows =
                entityManager
                        .createQuery(
                                "SELECT p.difficulty, COUNT(p) FROM DsaProblem p,"
                                        + " UserDsaProblemProgress pr"
                                        + " WHERE pr.problemId = p.id AND pr.userId = :userId"
                                        + " AND pr.status = 'SOLVED' AND p.status = 'PUBLISHED'"
                                        + " AND p.section.step.sheet.id = :sheetId"
                                        + " GROUP BY p.difficulty",
                                Object[].class)
                        .setParameter("userId", userId)
                        .setParameter("sheetId", sheetId)
                        .getResultList();

        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        return counts;
    }

    /**
     * The learner's next unsolved published problem in sheet order, if any.
     *
     * <p>A left join rather than a NOT IN: the progress row may not exist at all, which is the
     * common case for a learner who has never opened the problem.
     */
    public Optional<UUID> nextUnsolvedProblemId(String userId, UUID sheetId) {
        List<UUID> ids =
                entityManager
                        .createQuery(
                                "SELECT p.id FROM DsaProblem p"
                                        + " LEFT JOIN UserDsaProblemProgress pr"
                                        + " ON pr.problemId = p.id AND pr.userId = :userId"
                                        + " WHERE p.status = 'PUBLISHED'"
                                        + " AND p.section.step.sheet.id = :sheetId"
                                        + " AND (pr.id IS NULL OR pr.status <> 'SOLVED')"
                                        + " ORDER BY p.section.step.orderIndex ASC,"
                                        + " p.section.orderIndex ASC, p.orderIndex ASC",
                                UUID.class)
                        .setParameter("userId", userId == null ? "" : userId)
                        .setParameter("sheetId", sheetId)
                        .setMaxResults(1)
                        .getResultList();
        return ids.stream().findFirst();
    }
}
