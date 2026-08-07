package com.learnnow.learningprogress.dto.response;

import java.util.List;

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
    int currentUserWeeklyPoints
) {}
