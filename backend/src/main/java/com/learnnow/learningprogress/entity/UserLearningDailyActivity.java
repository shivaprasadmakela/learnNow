package com.learnnow.learningprogress.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
        name = "user_learning_daily_activity",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "activity_date"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLearningDailyActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "first_activity_at", nullable = false)
    private Instant firstActivityAt;

    @Column(name = "last_activity_at", nullable = false)
    private Instant lastActivityAt;

    @Column(name = "qualifying_event_count", nullable = false)
    @Builder.Default
    private int qualifyingEventCount = 0;

    @Column(name = "points_earned", nullable = false)
    @Builder.Default
    private int pointsEarned = 0;

    public void addPoints(int points) {
        this.pointsEarned += points;
    }
}
