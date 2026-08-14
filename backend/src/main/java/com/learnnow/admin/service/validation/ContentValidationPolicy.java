package com.learnnow.admin.service.validation;

import com.learnnow.admin.entity.ContentBlock;
import com.learnnow.admin.entity.QuizQuestion;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.paths.entity.Subtopic;
import java.util.List;

public class ContentValidationPolicy {

    public void validateSubtopicForPublishing(Subtopic subtopic, List<ContentBlock> blocks) {
        if (subtopic.getTitle() == null || subtopic.getTitle().isBlank()) {
            throw new ValidationException("subtopic_title_empty");
        }

        if (blocks != null) {
            for (ContentBlock block : blocks) {
                if ("markdown".equalsIgnoreCase(block.getType())) {
                    if (block.getBody() == null || block.getBody().isBlank()) {
                        throw new ValidationException("markdown_block_body_blank");
                    }
                } else if ("quiz".equalsIgnoreCase(block.getType())) {
                    if (block.getQuestions() == null || block.getQuestions().isEmpty()) {
                        throw new ValidationException("quiz_block_questions_empty");
                    }
                    for (QuizQuestion q : block.getQuestions()) {
                        if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                            throw new ValidationException("quiz_question_prompt_blank");
                        }
                        if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
                            throw new ValidationException("quiz_question_correct_answer_missing");
                        }
                    }
                }
            }
        }
    }
}
