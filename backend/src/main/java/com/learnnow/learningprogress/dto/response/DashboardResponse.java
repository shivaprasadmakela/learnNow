package com.learnnow.learningprogress.dto.response;

import java.util.List;

/**
 * @param publishedPathsCount every path a learner can study
 * @param completedPathsCount those of them this learner has finished - the same 100% the Paths page
 *     shows. Both are here so the overall-progress card need not fetch the path list to count it.
 */
public record DashboardResponse(
        int currentStreak,
        int longestStreak,
        int totalPoints,
        String timezone,
        List<WeeklyCalendarDay> weeklyCalendar,
        List<RecentTopicActivity> recentTopics,
        DashboardBanner banner,
        List<WeeklyLeaderboardEntry> weeklyLeaderboard,
        int currentUserRank,
        int currentUserWeeklyPoints,
        int publishedPathsCount,
        int completedPathsCount) {}
