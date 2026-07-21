package com.learnnow.learningprogress.dto.response;

public record WeeklyLeaderboardEntry(
    String userId,
    String fullName,
    String avatar,
    int weeklyPoints,
    int currentStreak,
    int rank,
    String badge,
    boolean isCurrentUser
) {}
