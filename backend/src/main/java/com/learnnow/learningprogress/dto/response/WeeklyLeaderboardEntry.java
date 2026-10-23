package com.learnnow.learningprogress.dto.response;

/**
 * One row of the weekly league.
 *
 * <p>Other learners' ids are deliberately absent: the board shows a name, an avatar and a score,
 * and {@code isCurrentUser} is all the client needs to highlight its own row. An internal id on
 * every row was one more thing about other people sent to each viewer for no visible reason.
 */
public record WeeklyLeaderboardEntry(
        String fullName,
        String avatar,
        int weeklyPoints,
        int currentStreak,
        int rank,
        String badge,
        boolean isCurrentUser) {}
