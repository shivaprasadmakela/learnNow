package com.learnnow.paths.repository;

import com.learnnow.paths.entity.Subtopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SubtopicRepository extends JpaRepository<Subtopic, UUID> {
}
