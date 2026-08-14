package com.learnnow.paths.repository;

import com.learnnow.paths.entity.Subtopic;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubtopicRepository extends JpaRepository<Subtopic, UUID> {

    @Query("SELECT st FROM Subtopic st JOIN FETCH st.topic WHERE st.id = :id")
    Optional<Subtopic> findByIdWithTopic(@Param("id") UUID id);
}
