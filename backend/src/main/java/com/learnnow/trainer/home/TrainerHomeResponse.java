package com.learnnow.trainer.home;

import com.learnnow.trainer.dto.GoalResponse;
import com.learnnow.trainer.interview.dto.TopicInterviewSummaryResponse;
import com.learnnow.trainer.readiness.TopicReadiness;
import java.util.List;
import java.util.Map;

/**
 * Everything the trainer page and the dashboard card need in one call. When {@code personalised} is
 * false, {@code nudges}, {@code readiness} and {@code todayTasks} are empty: they are advice drawn
 * from the learner's records.
 */
public record TrainerHomeResponse(
        boolean available,
        boolean personalised,
        Features features,
        GoalResponse goal,
        Streak streak,
        List<Map<String, Object>> todayTasks,
        List<NudgeRules.Nudge> nudges,
        Readiness readiness,
        Quotas quotas,
        ResumeSummary resume,
        List<TopicInterviewSummaryResponse> recentInterviews) {

    public record Features(
            boolean askAi,
            boolean topicInterview,
            boolean mockInterview,
            boolean resume,
            boolean weeklyPlan) {}

    public record Streak(int currentDays, boolean studiedToday) {}

    public record Readiness(List<TopicReadiness> weakest, List<TopicReadiness> untested) {}

    public record Quotas(
            int topicInterviewsLeft,
            int mockInterviewsLeft,
            int resumeAnalysesLeft,
            int retriesLeftToday,
            int planRefreshesLeft) {}

    public record ResumeSummary(boolean present, Integer overall, String targetRole) {}
}
