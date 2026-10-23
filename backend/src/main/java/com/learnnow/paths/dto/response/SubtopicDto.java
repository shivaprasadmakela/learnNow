package com.learnnow.paths.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * One lesson in full - its text, code and concept check - sent when the learner reaches it.
 *
 * <p>A quiz question carries no answer: {@link QuizQuestionDto} has no field for one. The answer
 * and explanation arrive from the server-side check when the learner answers, and come back here in
 * {@code attempt} once they have, so a reload shows the result instead of asking again. A snippet's
 * expected output is not in it either - only whether it has one; it is fetched once the learner has
 * run the snippet.
 */
public record SubtopicDto(
        UUID id,
        String title,
        String content,
        int orderIndex,
        boolean isCompleted,
        String level,
        String track,
        List<String> prerequisites,
        String videoUrl,
        int estimatedMinutes,
        List<CodeSnippetDto> codeSnippets,
        List<QuizQuestionDto> questions) {
    public record CodeSnippetDto(
            String id,
            String language,
            String label,
            String code,
            boolean hasExpectedOutput,
            boolean runnable,
            boolean editable,
            int orderIndex) {}

    public record QuizQuestionDto(
            UUID id,
            String kind,
            String prompt,
            List<String> options,
            int points,
            Attempt attempt) {}

    /**
     * The learner's first answer to a question. The answer and explanation are filled in only when
     * it was right, as the quiz check releases them.
     */
    public record Attempt(boolean isCorrect, String correctAnswer, String explanation) {}
}
