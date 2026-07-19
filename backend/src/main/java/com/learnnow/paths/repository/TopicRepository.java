package com.learnnow.paths.repository;

import com.learnnow.paths.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {

    @Query("SELECT t FROM Topic t LEFT JOIN FETCH t.subtopics WHERE t.id = :id")
    Optional<Topic> findByIdWithSubtopics(@Param("id") Long id);
}
