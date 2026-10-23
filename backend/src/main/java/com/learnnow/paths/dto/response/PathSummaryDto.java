package com.learnnow.paths.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * A path in a list response: what a path card and the path page's header show, and nothing more.
 * Its topics are not in it - they arrive from {@code GET /api/paths/{pathId}/topics} when the path
 * is opened - so a list of paths stays a list of paths.
 *
 * <p>{@code topicCount} counts published topics and {@code progressPercentage} is the mean of their
 * progress, counting published lessons only. {@code estimatedMinutes} sums the authored estimates
 * of the path's published lessons. {@code interviewQuestionCount} labels the path's Interview tab,
 * so the tab can say how many questions it holds without loading any of them. {@code tracks} are
 * the career tracks the path is a step of, for the links back to them.
 */
public record PathSummaryDto(
        UUID id,
        String title,
        String description,
        String category,
        String managedBy,
        int progressPercentage,
        int topicCount,
        long estimatedMinutes,
        int interviewQuestionCount,
        List<TrackRef> tracks) {

    /** A track the path belongs to - enough to link to it. */
    public record TrackRef(String slug, String title) {}
}
