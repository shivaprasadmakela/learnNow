package com.learnnow.learningprogress;

import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import com.learnnow.learningprogress.dto.response.DashboardResponse;
import com.learnnow.learningprogress.dto.response.WeeklyCalendarDay;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.service.ActivityRecordingService;
import com.learnnow.learningprogress.service.DashboardService;
import com.learnnow.learningprogress.service.ProgressService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
public class DashboardIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ProgressService progressService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRecordingService activityRecordingService;

    @Autowired
    private UserLearningPreferencesRepository preferencesRepository;

    @Test
    public void testBuildDashboard() {
        DashboardResponse response = dashboardService.buildDashboard("TEST_USER");
        assertNotNull(response);
    }

    @Test
    public void testTopicCompletionUpdatesStreakAndPoints() {
        String testUserId = "USER_STREAK_TEST_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(User.builder()
                    .id(testUserId)
                    .email("streak_test@example.com")
                    .passwordHash("hashedpass")
                    .fullName("Streak Tester")
                    .build());
        }

        // Complete 2 topics
        progressService.setTopicCompletion(testUserId, 1L, true);
        progressService.setTopicCompletion(testUserId, 2L, true);

        DashboardResponse response = dashboardService.buildDashboard(testUserId);

        // Expect streak = 1 and points >= 40 (20 pts per topic)
        assertEquals(1, response.currentStreak());
        assertTrue(response.totalPoints() >= 40, "Points should be at least 40, got: " + response.totalPoints());
        assertEquals(2, response.paths().get(0).completedTopicsCount());
    }

    @Test
    public void testNoActivityTodayDoesNotMarkTodayCompleted() {
        String testUserId = "USER_NO_ACTIVITY_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(User.builder()
                    .id(testUserId)
                    .email("no_activity@example.com")
                    .passwordHash("hashedpass")
                    .fullName("No Activity Tester")
                    .build());
        }

        DashboardResponse response = dashboardService.buildDashboard(testUserId);
        String todayStr = LocalDate.now().toString();

        WeeklyCalendarDay todayCalendarDay = response.weeklyCalendar().stream()
                .filter(day -> day.date().toString().equals(todayStr))
                .findFirst()
                .orElse(null);

        assertNotNull(todayCalendarDay);
        assertFalse(todayCalendarDay.completed(), "Today should NOT be marked completed when user has 0 activity today!");
    }

    @Test
    public void testSubtopicCompletionUpdatesStreakAndCalendar() {
        String testUserId = "USER_SUBTOPIC_TEST_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(User.builder()
                    .id(testUserId)
                    .email("subtopic_test@example.com")
                    .passwordHash("hashedpass")
                    .fullName("Subtopic Tester")
                    .build());
        }

        // Complete a subtopic (subtopic ID 1L exists from catalog seeder)
        progressService.markSubtopicComplete(testUserId, 1L, true);

        DashboardResponse response = dashboardService.buildDashboard(testUserId);
        String todayStr = LocalDate.now().toString();

        WeeklyCalendarDay todayCalendarDay = response.weeklyCalendar().stream()
                .filter(day -> day.date().toString().equals(todayStr))
                .findFirst()
                .orElse(null);

        assertNotNull(todayCalendarDay);
        assertTrue(todayCalendarDay.completed(), "Today should be marked completed when subtopic activity occurs!");
        assertEquals(1, response.currentStreak());
    }

    @Test
    public void testStaleStreakResetsToZeroOnNextActivity() {
        String testUserId = "USER_STALE_STREAK_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(User.builder()
                    .id(testUserId)
                    .email("stale_streak@example.com")
                    .passwordHash("hashedpass")
                    .fullName("Stale Streak Tester")
                    .build());
        }

        // Set up stale streak: last activity 3 days ago, current streak = 5
        UserLearningPreferences prefs = UserLearningPreferences.builder()
                .userId(testUserId)
                .currentStreak(5)
                .longestStreak(5)
                .lastActivityDate(LocalDate.now().minusDays(3))
                .build();
        preferencesRepository.save(prefs);

        // Trigger a write-path activity today — this is what expires the stale streak
        java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
        activityRecordingService.recordDailyPoints(testUserId, zone, 10);

        // After the write, the streak should have been reset to 1 (expired then restarted)
        UserLearningPreferences updated = preferencesRepository.findByUserId(testUserId).orElseThrow();
        assertEquals(1, updated.getCurrentStreak(),
                "Stale streak should be expired to 0, then restarted at 1 after new activity!");
    }
}

