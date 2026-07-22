package com.learnnow.paths.repository;

import com.learnnow.paths.entity.Path;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PathRepository extends JpaRepository<Path, Long> {

    List<Path> findByCategoryIgnoreCase(String category);

    /**
     * Load all paths with their topics in one query (LEFT JOIN FETCH).
     * Use this anywhere that needs Path.topics to avoid N+1 on a LAZY association.
     */
    @Query("SELECT DISTINCT p FROM Path p LEFT JOIN FETCH p.topics ORDER BY p.id")
    List<Path> findAllWithTopics();
}

