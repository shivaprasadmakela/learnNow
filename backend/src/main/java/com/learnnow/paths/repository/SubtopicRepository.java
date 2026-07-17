package com.learnnow.paths.repository;

import com.learnnow.paths.entity.Subtopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface SubtopicRepository extends JpaRepository<Subtopic, Long> {

    @Query("SELECT s FROM Subtopic s LEFT JOIN FETCH s.sections WHERE s.id = :id")
    Optional<Subtopic> findByIdWithSections(@Param("id") Long id);
}
