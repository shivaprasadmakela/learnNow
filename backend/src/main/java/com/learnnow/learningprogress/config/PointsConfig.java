package com.learnnow.learningprogress.config;

/**
 * Centralized points configuration. All point values live here so they can be tuned in one place.
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

    /**
     * A solved DSA problem, scaled by difficulty.
     *
     * <p>All three sit above a subtopic's 5: solving a problem is more work than reading a section.
     * Awarded once per problem ever, guarded on {@code solved_at} - re-submitting an accepted
     * solution records the submission and awards nothing.
     */
    public static final int DSA_SOLVED_EASY = 8;

    public static final int DSA_SOLVED_MEDIUM = 15;
    public static final int DSA_SOLVED_HARD = 25;

    /** Answering a statement's inline check correctly, first attempt only. */
    public static final int DSA_CHECK_CORRECT = 2;

    /** Sits between a topic (20) and a path (100). */
    public static final int DSA_STEP_COMPLETED_BONUS = 60;

    /** The headline achievement in the product. */
    public static final int DSA_SHEET_COMPLETED_BONUS = 750;

    /** Streak milestone bonuses. */
    public static final int STREAK_BONUS_3_DAYS = 10;

    public static final int STREAK_BONUS_7_DAYS = 25;
    public static final int STREAK_BONUS_30_DAYS = 100;
}
