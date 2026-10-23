package com.learnnow.paths.dto.response;

import java.util.UUID;

/**
 * One lesson in a topic's outline: what the table of contents and the topic list show. {@code
 * quizCount} says whether the lesson ends with a concept check, without sending the questions.
 */
public record LessonOutlineDto(
        UUID id,
        String title,
        int orderIndex,
        boolean isCompleted,
        String level,
        String track,
        int estimatedMinutes,
        int quizCount) {}
