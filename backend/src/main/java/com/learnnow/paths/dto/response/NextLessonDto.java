package com.learnnow.paths.dto.response;

import java.util.UUID;

/**
 * A lesson to open next, with the titles it takes to show it and build its URL - used wherever the
 * app offers "Continue": a career track's roadmap and the dashboard's next-step card.
 */
public record NextLessonDto(
        UUID pathId,
        String pathTitle,
        UUID topicId,
        String topicTitle,
        UUID subtopicId,
        String subtopicTitle) {}
