package com.learnnow.trainer.admin;

import com.learnnow.trainer.feature.AiFeatureService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The admin AI page. {@code usage} is learnnow-ai's own report (snake_case), null when it cannot be
 * reached. {@code flagged} carries no transcript: the comment and score are enough to decide
 * whether to look closer.
 */
public record AiAdminResponse(
        List<AiFeatureService.FlagView> flags,
        Map<String, Object> usage,
        Interviews interviews,
        List<Flagged> flagged,
        Quotas quotas) {

    /** Interviews started this month (UTC), by kind, then by status. */
    public record Interviews(Map<String, Map<String, Long>> thisMonth) {}

    public record Flagged(
            UUID id,
            String kind,
            String title,
            Integer overallScore,
            String comment,
            Instant createdAt) {}

    public record Quotas(int topicInterviews, int mockInterviews, int resumeAnalyses) {}
}
