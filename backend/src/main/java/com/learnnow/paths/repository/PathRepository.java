package com.learnnow.paths.repository;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface PathRepository extends JpaRepository<Path, UUID> {

    List<Path> findByStatus(ContentStatus status);

    List<Path> findByCategoryIgnoreCaseAndStatus(String category, ContentStatus status);

    java.util.Optional<Path> findByTitleIgnoreCase(String title);

    @Query("SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.topics t WHERE p.status = :status")
    List<Path> findAllWithTopicsByStatus(@Param("status") ContentStatus status);

    @Query("SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.topics t ORDER BY p.title ASC")
    List<Path> findAllWithTopics();

    @Query("SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.topics t WHERE p.id = :id")
    java.util.Optional<Path> findByIdWithTopics(@Param("id") UUID id);
}
