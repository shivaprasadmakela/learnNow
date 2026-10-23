package com.learnnow.notes.dto.response;

import com.learnnow.notes.entity.NoteTarget;
import java.time.Instant;
import java.util.UUID;

/**
 * One bookmark with what the bookmarks list shows of its target.
 *
 * <p>Exactly one of {@code topic} and {@code problem} is set, matching {@code target}. The list
 * used to take only ids and then fetch each target in full - a topic with every lesson's content, a
 * problem with its editorial - to show a title and a progress bar.
 */
public record BookmarkSummaryResponse(
        UUID id,
        NoteTarget target,
        UUID targetId,
        Instant createdAt,
        TopicSummary topic,
        ProblemSummary problem) {

    /**
     * @param pathId the path the learner studies the topic in, or else its first published one;
     *     null when it is in none
     * @param progressPercentage published lessons completed, or 100 once the topic is complete
     */
    public record TopicSummary(
            String title,
            String description,
            UUID pathId,
            String pathTitle,
            int progressPercentage,
            boolean completed) {}

    /**
     * @param stepSlug with {@code slug}, what the workspace route needs
     * @param status the learner's own: NOT_STARTED, ATTEMPTED or SOLVED
     */
    public record ProblemSummary(
            String slug,
            String title,
            String difficulty,
            String stepSlug,
            String stepTitle,
            String status) {}
}
