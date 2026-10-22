package com.learnnow.tracks.dto.response;

import com.learnnow.paths.dto.response.NextLessonDto;
import java.util.List;
import java.util.UUID;

/**
 * A track's roadmap: its steps in order, each with the signed-in learner's progress, and the lesson
 * to continue from - the first lesson not yet completed, in the first step not yet finished.
 * Progress fields and {@code nextLesson} are null for a visitor not signed in; {@code nextLesson}
 * is also null once every step is finished.
 */
public record TrackDetailDto(
        String slug,
        String title,
        String description,
        long estimatedMinutes,
        long optionalMinutes,
        Integer progressPercentage,
        List<Step> steps,
        NextLessonDto nextLesson) {

    public record Step(
            int stepNumber,
            UUID pathId,
            String title,
            String description,
            String category,
            boolean optional,
            String note,
            long topicCount,
            long estimatedMinutes,
            Integer progressPercentage) {}
}
