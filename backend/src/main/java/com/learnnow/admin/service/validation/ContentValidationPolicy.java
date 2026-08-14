package com.learnnow.admin.service.validation;

import com.learnnow.admin.entity.ContentBlock;
import com.learnnow.admin.entity.QuizQuestion;
import com.learnnow.paths.entity.Subtopic;
import java.util.List;

public class ContentValidationPolicy {

    public void validateSubtopicForPublishing(Subtopic subtopic, List<ContentBlock> blocks) {
        if (subtopic.getTitle() == null || subtopic.getTitle().isBlank()) {
            throw new IllegalArgumentException("Subtopic title cannot be empty");
        }

        if (blocks != null) {
            for (ContentBlock block : blocks) {
                if ("markdown".equalsIgnoreCase(block.getType())) {
                    if (block.getBody() == null || block.getBody().isBlank()) {
                        throw new IllegalArgumentException(
                                "Markdown content block body cannot be blank");
                    }
                } else if ("quiz".equalsIgnoreCase(block.getType())) {
                    if (block.getQuestions() == null || block.getQuestions().isEmpty()) {
                        throw new IllegalArgumentException(
                                "Quiz content block must contain at least one question");
                    }
                    for (QuizQuestion q : block.getQuestions()) {
                        if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                            throw new IllegalArgumentException(
                                    "Quiz question prompt cannot be blank");
                        }
                        if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
                            throw new IllegalArgumentException(
                                    "Quiz question must specify a valid correct_answer");
                        }
                    }
                }
            }
        }
    }
}
