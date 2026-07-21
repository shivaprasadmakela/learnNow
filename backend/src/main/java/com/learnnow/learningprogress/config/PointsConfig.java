package com.learnnow.learningprogress.config;

/**
 * Centralized points configuration.
 * All point values live here so they can be tuned in one place.
 * Later can be moved to a database table for admin configuration.
 */
public final class PointsConfig {

    private PointsConfig() {}

    /** Points awarded when a single subtopic is marked complete. */
    public static final int SUBTOPIC_COMPLETED = 5;

    /** Bonus points when all subtopics in a topic are completed (auto-completes the topic). */
    public static final int TOPIC_COMPLETED_BONUS = 20;

    /** Bonus points when all topics in a path are completed. */
    public static final int PATH_COMPLETED_BONUS = 100;

    /** Streak milestone bonuses. */
    public static final int STREAK_BONUS_3_DAYS = 10;
    public static final int STREAK_BONUS_7_DAYS = 25;
    public static final int STREAK_BONUS_30_DAYS = 100;
}
