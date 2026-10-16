package com.learnnow.tracks.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * A track as the catalog lists it.
 *
 * <p>{@code estimatedMinutes} and {@code topicCount} cover the required steps only - the time it
 * takes to finish the track - and {@code optionalMinutes} is the extra the optional steps add.
 * {@code progressPercentage} is null for a visitor who is not signed in.
 */
public record TrackSummaryDto(
        String slug,
        String title,
        String description,
        int stepCount,
        int optionalStepCount,
        long topicCount,
        long estimatedMinutes,
        long optionalMinutes,
        Integer progressPercentage,
        List<StepRef> steps) {

    /** Enough of a step to preview the route on a card, and to find the tracks a path is in. */
    public record StepRef(UUID pathId, String title, boolean optional) {}
}
