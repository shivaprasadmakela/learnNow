package com.learnnow.paths.dao;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public class PathDao {

    @PersistenceContext private EntityManager entityManager;

    /** Fetch all paths with their topics eagerly in a single JOIN FETCH query. */
    public List<Path> findAllWithTopics() {
        return entityManager
                .createQuery(
                        "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT JOIN"
                                + " FETCH pt.topic ORDER BY p.title ASC",
                        Path.class)
                .getResultList();
    }

    /**
     * One page of paths with their topics eagerly loaded.
     *
     * <p>Done in two queries on purpose: applying a limit to a {@code JOIN FETCH} of a collection
     * makes Hibernate fetch every row and paginate in memory, which defeats the point. So the page
     * of ids is selected first, then those paths are fetched whole.
     */
    public Page<Path> findPageWithTopics(Pageable pageable) {
        long total =
                entityManager
                        .createQuery("SELECT COUNT(p) FROM Path p", Long.class)
                        .getSingleResult();
        if (total == 0) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        List<UUID> ids =
                entityManager
                        .createQuery("SELECT p.id FROM Path p ORDER BY p.title ASC", UUID.class)
                        .setFirstResult((int) pageable.getOffset())
                        .setMaxResults(pageable.getPageSize())
                        .getResultList();
        if (ids.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, total);
        }

        List<Path> paths =
                entityManager
                        .createQuery(
                                "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT"
                                        + " JOIN FETCH pt.topic WHERE p.id IN :ids ORDER BY p.title"
                                        + " ASC",
                                Path.class)
                        .setParameter("ids", ids)
                        .getResultList();
        return new PageImpl<>(paths, pageable, total);
    }

    /** Fetch a single path with its topics eagerly by ID. */
    public Optional<Path> findByIdWithTopics(UUID id) {
        return entityManager
                .createQuery(
                        "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT JOIN"
                                + " FETCH pt.topic WHERE p.id = :id",
                        Path.class)
                .setParameter("id", id)
                .getResultList()
                .stream()
                .findFirst();
    }

    /**
     * Fetch a full admin path by ID with all topics, subtopics, content blocks, code snippets, and
     * quiz questions loaded via optimized batch queries (eliminating N+1 query overhead).
     */
    public Optional<Path> findFullAdminPathById(UUID id) {
        List<Path> paths =
                entityManager
                        .createQuery(
                                "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT"
                                        + " JOIN FETCH pt.topic WHERE p.id = :id",
                                Path.class)
                        .setParameter("id", id)
                        .getResultList();

        if (paths.isEmpty()) {
            return Optional.empty();
        }

        Path path = paths.get(0);
        List<UUID> topicIds =
                path.getTopics().stream().map(com.learnnow.paths.entity.Topic::getId).toList();

        if (!topicIds.isEmpty()) {
            // Step 1: Eagerly fetch subtopics for all topics of this path
            entityManager
                    .createQuery(
                            "SELECT DISTINCT t FROM Topic t LEFT JOIN FETCH t.subtopics st WHERE"
                                    + " t.id IN :topicIds",
                            com.learnnow.paths.entity.Topic.class)
                    .setParameter("topicIds", topicIds)
                    .getResultList();

            List<UUID> subtopicIds =
                    path.getTopics().stream()
                            .flatMap(
                                    t ->
                                            t.getSubtopics() != null
                                                    ? t.getSubtopics().stream()
                                                    : java.util.stream.Stream.empty())
                            .map(com.learnnow.paths.entity.Subtopic::getId)
                            .toList();

            if (!subtopicIds.isEmpty()) {
                // Step 2: Eagerly fetch blocks for all subtopics
                entityManager
                        .createQuery(
                                "SELECT DISTINCT st FROM Subtopic st LEFT JOIN FETCH st.blocks"
                                        + " WHERE st.id IN :ids",
                                com.learnnow.paths.entity.Subtopic.class)
                        .setParameter("ids", subtopicIds)
                        .getResultList();

                // Step 3: Eagerly fetch code snippets for all subtopics
                entityManager
                        .createQuery(
                                "SELECT DISTINCT st FROM Subtopic st LEFT JOIN FETCH"
                                        + " st.codeSnippets WHERE st.id IN :ids",
                                com.learnnow.paths.entity.Subtopic.class)
                        .setParameter("ids", subtopicIds)
                        .getResultList();

                List<UUID> blockIds =
                        path.getTopics().stream()
                                .flatMap(
                                        t ->
                                                t.getSubtopics() != null
                                                        ? t.getSubtopics().stream()
                                                        : java.util.stream.Stream.empty())
                                .flatMap(
                                        st ->
                                                st.getBlocks() != null
                                                        ? st.getBlocks().stream()
                                                        : java.util.stream.Stream.empty())
                                .map(com.learnnow.admin.entity.ContentBlock::getId)
                                .toList();

                if (!blockIds.isEmpty()) {
                    // Step 4: Eagerly fetch quiz questions for all content blocks
                    entityManager
                            .createQuery(
                                    "SELECT DISTINCT b FROM ContentBlock b LEFT JOIN FETCH"
                                            + " b.questions WHERE b.id IN :ids",
                                    com.learnnow.admin.entity.ContentBlock.class)
                            .setParameter("ids", blockIds)
                            .getResultList();
                }
            }
        }

        return Optional.of(path);
    }

    /** Fetch all published/draft paths filtered by status with topics eagerly loaded. */
    public List<Path> findAllWithTopicsByStatus(ContentStatus status) {
        return entityManager
                .createQuery(
                        "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT JOIN"
                                + " FETCH pt.topic WHERE p.status = :status",
                        Path.class)
                .setParameter("status", status)
                .getResultList();
    }

    /** Fetch path by title (case-insensitive) for duplicate checks during import. */
    public Optional<Path> findByTitleIgnoreCase(String title) {
        return entityManager
                .createQuery(
                        "SELECT p FROM Path p WHERE LOWER(p.title) = LOWER(:title)", Path.class)
                .setParameter("title", title.trim())
                .getResultList()
                .stream()
                .findFirst();
    }

    /**
     * Delete a path using native SQL. PostgreSQL ON DELETE CASCADE handles all child entities
     * (topics, subtopics, blocks, questions, snippets) in a single database round-trip, avoiding
     * Hibernate's N+1 cascade loading storm that loads every child entity before deleting.
     */
    public void deletePathNative(UUID id) {
        entityManager
                .createNativeQuery("DELETE FROM paths WHERE id = :id")
                .setParameter("id", id)
                .executeUpdate();
    }
}
