package com.learnnow.learningprogress.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Entity
@Table(name = "user_learning_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLearningPreferences {

    @Id
    @Column(name = "user_id")
    private String userId;

    /**
     * Optimistic lock. Point awards are read-modify-write, so without this two concurrent awards
     * silently lost one of the two increments.
     */
    @Version @Builder.Default private Long version = 0L;

    @Column(nullable = false)
    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Column(name = "current_streak", nullable = false)
    @Builder.Default
    private int currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    @Builder.Default
    private int longestStreak = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(name = "total_points", nullable = false)
    @Builder.Default
    private int totalPoints = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addPoints(int points) {
        this.totalPoints += points;
    }

    public void updateStreak(LocalDate activityDate) {
        if (this.lastActivityDate == null) {
            this.currentStreak = 1;
            this.longestStreak = Math.max(this.longestStreak, 1);
            this.lastActivityDate = activityDate;
        } else if (this.lastActivityDate.equals(activityDate)) {
            // Same day, no-op
        } else if (this.lastActivityDate.plusDays(1).equals(activityDate)) {
            this.currentStreak += 1;
            this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
            this.lastActivityDate = activityDate;
        } else {
            this.currentStreak = 1;
            this.longestStreak = Math.max(this.longestStreak, 1);
            this.lastActivityDate = activityDate;
        }
    }

    public int getCurrentStreakForDate(LocalDate today) {
        if (this.lastActivityDate == null || this.lastActivityDate.isBefore(today.minusDays(1))) {
            return 0;
        }
        return this.currentStreak;
    }
}
