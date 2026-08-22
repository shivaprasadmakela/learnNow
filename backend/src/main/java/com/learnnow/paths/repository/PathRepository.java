package com.learnnow.paths.repository;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PathRepository extends JpaRepository<Path, UUID> {

    List<Path> findByStatus(ContentStatus status);

    Page<Path> findByStatus(ContentStatus status, Pageable pageable);

    List<Path> findByCategoryIgnoreCaseAndStatus(String category, ContentStatus status);

    java.util.Optional<Path> findByTitleIgnoreCase(String title);

    @Query(
            "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT JOIN FETCH pt.topic"
                    + " WHERE p.status = :status")
    List<Path> findAllWithTopicsByStatus(@Param("status") ContentStatus status);

    @Query(
            "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT JOIN FETCH pt.topic"
                    + " ORDER BY p.title ASC")
    List<Path> findAllWithTopics();

    @Query(
            "SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.pathTopics pt LEFT JOIN FETCH pt.topic"
                    + " WHERE p.id = :id")
    java.util.Optional<Path> findByIdWithTopics(@Param("id") UUID id);
}
