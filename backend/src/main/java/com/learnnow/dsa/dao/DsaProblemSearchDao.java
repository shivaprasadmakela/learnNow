package com.learnnow.dsa.dao;

import com.learnnow.dsa.entity.DsaDifficulty;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * Search across every published problem in a sheet.
 *
 * <p>The sheet page used to filter in the browser, which meant fetching the first page of every
 * step - eighteen requests on the first keystroke - and then searching only those first ten rows of
 * each. Doing it here is one query for the page and one for the count, over the whole sheet.
 *
 * <p>Native SQL because a tag match has to look inside a JSONB array, which JPQL cannot express.
 * The optional clauses are appended rather than written as {@code (:x IS NULL OR ...)}: Postgres
 * cannot infer a type for a null parameter it only ever compares, and the planner does better with
 * a predicate that is simply absent.
 */
@Repository
public class DsaProblemSearchDao {

    /** Which of the learner's own problems to keep. The values match the sheet page's filter. */
    public enum StatusFilter {
        ALL,
        TODO,
        SOLVED,
        BOOKMARKED
    }

    /** {@code query} is matched against titles and tags; null or blank matches everything. */
    public record Criteria(String query, DsaDifficulty difficulty, StatusFilter status) {}

    @PersistenceContext private EntityManager entityManager;

    /**
     * One page of matching problem ids, in sheet order.
     *
     * <p>Ids rather than rows, so the caller builds rows through the same code the step endpoint
     * uses and the two cannot drift apart. The order is step, then section in tree order, then
     * position, with ids as the final tie-break - pagination over an order with ties repeats rows
     * on one page and skips them on the next.
     */
    @SuppressWarnings("unchecked")
    public Page<UUID> search(UUID sheetId, String userId, Criteria criteria, Pageable pageable) {
        boolean signedIn = userId != null && !userId.isBlank();
        StatusFilter status = criteria.status() == null ? StatusFilter.ALL : criteria.status();

        // Nothing an anonymous caller has can be solved or bookmarked, and nothing is "to do"
        // more than everything is.
        if (!signedIn && (status == StatusFilter.SOLVED || status == StatusFilter.BOOKMARKED)) {
            return Page.empty(pageable);
        }

        StringBuilder where =
                new StringBuilder(
                        " FROM dsa_problems p"
                                + " JOIN dsa_sections s ON s.id = p.section_id"
                                + " JOIN dsa_steps st ON st.id = s.step_id"
                                + " WHERE st.sheet_id = :sheetId AND p.status = 'PUBLISHED'");
        Map<String, Object> params = new HashMap<>();
        params.put("sheetId", sheetId);

        String pattern = likePattern(criteria.query());
        if (pattern != null) {
            where.append(
                    " AND (p.title ILIKE :pattern ESCAPE '\\'"
                            + " OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.tags) tag"
                            + " WHERE tag ILIKE :pattern ESCAPE '\\'))");
            params.put("pattern", pattern);
        }

        if (criteria.difficulty() != null) {
            where.append(" AND p.difficulty = :difficulty");
            params.put("difficulty", criteria.difficulty().name());
        }

        String solved =
                "SELECT 1 FROM user_dsa_problem_progress pr WHERE pr.problem_id = p.id"
                        + " AND pr.user_id = :userId AND pr.status = 'SOLVED'";
        switch (status) {
            case SOLVED -> where.append(" AND EXISTS (").append(solved).append(')');
            case TODO -> {
                if (signedIn) where.append(" AND NOT EXISTS (").append(solved).append(')');
            }
            case BOOKMARKED ->
                    where.append(
                            " AND EXISTS (SELECT 1 FROM bookmarks b"
                                    + " WHERE b.dsa_problem_id = p.id AND b.user_id = :userId)");
            case ALL -> {}
        }
        if (signedIn && status != StatusFilter.ALL) {
            params.put("userId", userId);
        }

        Query count = entityManager.createNativeQuery("SELECT COUNT(*)" + where);
        params.forEach(count::setParameter);
        long total = ((Number) count.getSingleResult()).longValue();
        if (total == 0) return Page.empty(pageable);

        Query page =
                entityManager.createNativeQuery(
                        "SELECT p.id"
                                + where
                                + " ORDER BY st.order_index, s.path, s.order_index, s.id,"
                                + " p.order_index, p.id");
        params.forEach(page::setParameter);
        page.setFirstResult((int) pageable.getOffset());
        page.setMaxResults(pageable.getPageSize());

        List<UUID> ids =
                ((List<Object>) page.getResultList())
                        .stream().map(DsaProblemSearchDao::toUuid).toList();
        return new PageImpl<>(ids, pageable, total);
    }

    /**
     * A case-insensitive substring pattern, with the learner's own {@code %} and {@code _} taken
     * literally. Without the escaping, searching for "_" matched every problem in the sheet.
     */
    static String likePattern(String query) {
        if (query == null || query.isBlank()) return null;
        String trimmed = query.trim();
        if (trimmed.length() > MAX_QUERY_LENGTH) trimmed = trimmed.substring(0, MAX_QUERY_LENGTH);
        String escaped = trimmed.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    /** A title is at most 255 characters, so a longer query can only fail to match. */
    private static final int MAX_QUERY_LENGTH = 255;

    private static UUID toUuid(Object value) {
        return value instanceof UUID uuid ? uuid : UUID.fromString(String.valueOf(value));
    }
}
