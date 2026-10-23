package com.learnnow.paths.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * A topic as the study console opens it: its lessons as an outline, without their text. Each
 * lesson's content, code and quiz arrive from {@code GET /api/subtopics/{id}} when the learner
 * reaches it. {@code interviewQuestionCount} labels the topic's Interview tab before any question
 * is fetched.
 */
public record TopicDetailDto(
        UUID id,
        String title,
        String description,
        String category,
        String duration,
        boolean isCompleted,
        int progressPercentage,
        int interviewQuestionCount,
        List<LessonOutlineDto> subtopics) {}
