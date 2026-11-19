package com.learnnow.trainer.interview.dto;

import java.util.List;

/**
 * Whether the learner can start a mock interview now, and which kinds there are. {@code reason} is
 * a message code when {@code available} is false.
 */
public record MockAvailabilityResponse(
        boolean available, String reason, int left, boolean hasResume, List<KindOption> kinds) {

    public record KindOption(String kind, String label, int minutes, boolean needsResume) {}
}
