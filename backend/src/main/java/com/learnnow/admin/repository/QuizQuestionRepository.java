package com.learnnow.admin.repository;

import com.learnnow.admin.entity.QuizQuestion;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {
    List<QuizQuestion> findByBlockId(UUID blockId);
}
