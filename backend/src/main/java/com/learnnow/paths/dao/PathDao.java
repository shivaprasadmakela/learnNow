package com.learnnow.paths.dao;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PathDao {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Fetch all paths with their topics eagerly in a single JOIN FETCH query.
     */
    public List<Path> findAllWithTopics() {
        return entityManager.createQuery(
                "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.topics t ORDER BY p.title ASC", Path.class)
                .getResultList();
    }

    /**
     * Fetch a single path with its topics eagerly by ID.
     */
    public Optional<Path> findByIdWithTopics(UUID id) {
        return entityManager.createQuery(
                "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.topics t WHERE p.id = :id", Path.class)
                .setParameter("id", id)
                .getResultList()
                .stream()
                .findFirst();
    }

    /**
     * Fetch all published/draft paths filtered by status with topics eagerly loaded.
     */
    public List<Path> findAllWithTopicsByStatus(ContentStatus status) {
        return entityManager.createQuery(
                "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.topics t WHERE p.status = :status", Path.class)
                .setParameter("status", status)
                .getResultList();
    }

    /**
     * Fetch path by title (case-insensitive) for duplicate checks during import.
     */
    public Optional<Path> findByTitleIgnoreCase(String title) {
        return entityManager.createQuery(
                "SELECT p FROM Path p WHERE LOWER(p.title) = LOWER(:title)", Path.class)
                .setParameter("title", title.trim())
                .getResultList()
                .stream()
                .findFirst();
    }
}
