package com.learnnow.learningprogress;

import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import com.learnnow.learningprogress.dto.response.DashboardResponse;
import com.learnnow.learningprogress.service.DashboardService;
import com.learnnow.learningprogress.service.ProgressService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

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
}
