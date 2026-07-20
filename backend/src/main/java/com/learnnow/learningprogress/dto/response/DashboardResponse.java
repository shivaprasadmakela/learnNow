package com.learnnow.learningprogress.dto.response;

import java.util.List;

public record DashboardResponse(
    int currentStreak,
    int longestStreak,
    int totalPoints,
    String timezone,
    List<WeeklyCalendarDay> weeklyCalendar,
    List<ActivityFeedItem> activities,
    List<PathProgressSummary> paths,
    DashboardBanner banner
) {}
