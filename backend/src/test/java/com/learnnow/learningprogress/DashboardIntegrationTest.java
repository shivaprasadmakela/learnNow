package com.learnnow.learningprogress;

import static org.junit.jupiter.api.Assertions.*;

import com.learnnow.learningprogress.dto.response.DashboardResponse;
import com.learnnow.learningprogress.dto.response.WeeklyCalendarDay;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.service.ActivityRecordingService;
import com.learnnow.learningprogress.service.DashboardService;
import com.learnnow.learningprogress.service.ProgressService;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.paths.service.CatalogService;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("local")
public class DashboardIntegrationTest {

    @Autowired private DashboardService dashboardService;

    @Autowired private ProgressService progressService;

    @Autowired private UserRepository userRepository;

    @Autowired private ActivityRecordingService activityRecordingService;

    @Autowired private UserLearningPreferencesRepository preferencesRepository;

    @Autowired private CatalogService catalogService;

    @Autowired private PathRepository pathRepository;

    @Autowired private TopicRepository topicRepository;

    @Autowired private SubtopicRepository subtopicRepository;

    @Autowired private UserSubtopicProgressRepository userSubtopicProgressRepository;

    private UUID samplePathId;
    private UUID sampleTopicId1;
    private UUID sampleTopicId2;
    private UUID sampleSubtopicId1;

    @BeforeEach
    @Transactional
    public void setUpSampleData() {
        List<Path> existingPaths = pathRepository.findByStatus(ContentStatus.PUBLISHED);
        if (existingPaths.isEmpty()) {
            Path path =
                    pathRepository.save(
                            Path.builder()
                                    .title("Sample Backend Path")
                                    .description("Test Description")
                                    .category("Backend")
                                    .managedBy("learnNow")
                                    .status(ContentStatus.PUBLISHED)
                                    .build());
            samplePathId = path.getId();

            Topic topic1 =
                    topicRepository.save(
                            Topic.builder()
                                    .path(path)
                                    .title("Topic 1")
                                    .description("Topic 1 Desc")
                                    .category("course")
                                    .duration("1 hour")
                                    .status(ContentStatus.PUBLISHED)
                                    .build());
            sampleTopicId1 = topic1.getId();

            Topic topic2 =
                    topicRepository.save(
                            Topic.builder()
                                    .path(path)
                                    .title("Topic 2")
                                    .description("Topic 2 Desc")
                                    .category("course")
                                    .duration("1 hour")
                                    .status(ContentStatus.PUBLISHED)
                                    .build());
            sampleTopicId2 = topic2.getId();

            Subtopic subtopic1 =
                    subtopicRepository.save(
                            Subtopic.builder()
                                    .topic(topic1)
                                    .title("Subtopic 1")
                                    .content("Content 1")
                                    .orderIndex(1)
                                    .status(ContentStatus.PUBLISHED)
                                    .version(1)
                                    .build());
            sampleSubtopicId1 = subtopic1.getId();
        } else {
            Path p = existingPaths.get(0);
            samplePathId = p.getId();
            List<Topic> topics = topicRepository.findAll();
            if (topics.isEmpty()) {
                Topic topic1 =
                        topicRepository.save(
                                Topic.builder()
                                        .path(p)
                                        .title("Topic 1")
                                        .description("Topic 1 Desc")
                                        .category("course")
                                        .duration("1 hour")
                                        .status(ContentStatus.PUBLISHED)
                                        .build());
                topics = List.of(topic1);
            }
            sampleTopicId1 = topics.get(0).getId();
            sampleTopicId2 = topics.size() > 1 ? topics.get(1).getId() : sampleTopicId1;

            List<Subtopic> subtopics = subtopicRepository.findAll();
            if (subtopics.isEmpty()) {
                Subtopic subtopic1 =
                        subtopicRepository.save(
                                Subtopic.builder()
                                        .topic(topics.get(0))
                                        .title("Subtopic 1")
                                        .content("Content 1")
                                        .orderIndex(1)
                                        .status(ContentStatus.PUBLISHED)
                                        .version(1)
                                        .build());
                sampleSubtopicId1 = subtopic1.getId();
            } else {
                sampleSubtopicId1 = subtopics.get(0).getId();
            }
        }
    }

    @Test
    public void testBuildDashboard() {
        DashboardResponse response = dashboardService.buildDashboard("TEST_USER");
        assertNotNull(response);
    }

    @Test
    public void testGetTopicDetails() {
        var response = catalogService.getTopicDetails(sampleTopicId1, "TEST_USER");
        assertNotNull(response);
    }

    @Test
    public void testTopicCompletionUpdatesStreakAndPoints() {
        String testUserId = "USER_STREAK_TEST_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(
                    User.builder()
                            .id(testUserId)
                            .email("streak_test@example.com")
                            .passwordHash("hashedpass")
                            .fullName("Streak Tester")
                            .build());
        }

        progressService.setTopicCompletion(testUserId, sampleTopicId1, true);
        if (sampleTopicId2 != null && !sampleTopicId2.equals(sampleTopicId1)) {
            progressService.setTopicCompletion(testUserId, sampleTopicId2, true);
        }

        DashboardResponse response = dashboardService.buildDashboard(testUserId);

        assertEquals(1, response.currentStreak());
        assertTrue(
                response.totalPoints() >= 20,
                "Points should be at least 20, got: " + response.totalPoints());
    }

    @Test
    public void testNoActivityTodayDoesNotMarkTodayCompleted() {
        String testUserId = "USER_NO_ACTIVITY_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(
                    User.builder()
                            .id(testUserId)
                            .email("no_activity@example.com")
                            .passwordHash("hashedpass")
                            .fullName("No Activity Tester")
                            .build());
        }

        DashboardResponse response = dashboardService.buildDashboard(testUserId);
        String todayStr = LocalDate.now().toString();

        WeeklyCalendarDay todayCalendarDay =
                response.weeklyCalendar().stream()
                        .filter(day -> day.date().toString().equals(todayStr))
                        .findFirst()
                        .orElse(null);

        assertNotNull(todayCalendarDay);
        assertFalse(
                todayCalendarDay.completed(),
                "Today should NOT be marked completed when user has 0 activity today!");
    }

    @Test
    public void testSubtopicCompletionUpdatesStreakAndCalendar() {
        String testUserId = "USER_SUBTOPIC_TEST_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(
                    User.builder()
                            .id(testUserId)
                            .email("subtopic_test@example.com")
                            .passwordHash("hashedpass")
                            .fullName("Subtopic Tester")
                            .build());
        }

        if (sampleSubtopicId1 != null) {
            userSubtopicProgressRepository.findAll().stream()
                    .filter(sp -> sp.getUserId().equals(testUserId))
                    .forEach(sp -> userSubtopicProgressRepository.delete(sp));
            preferencesRepository.findByUserId(testUserId).ifPresent(preferencesRepository::delete);
            progressService.markSubtopicComplete(testUserId, sampleSubtopicId1, true);
        }

        DashboardResponse response = dashboardService.buildDashboard(testUserId);
        String todayStr = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")).toString();

        WeeklyCalendarDay todayCalendarDay =
                response.weeklyCalendar().stream()
                        .filter(day -> day.date().toString().equals(todayStr))
                        .findFirst()
                        .orElse(null);

        assertNotNull(todayCalendarDay);
        assertTrue(
                todayCalendarDay.completed(),
                "Today should be marked completed when subtopic activity occurs!");
        assertEquals(1, response.currentStreak());
    }

    @Test
    public void testStaleStreakResetsToZeroOnNextActivity() {
        String testUserId = "USER_STALE_STREAK_ID";
        if (userRepository.findById(testUserId).isEmpty()) {
            userRepository.save(
                    User.builder()
                            .id(testUserId)
                            .email("stale_streak@example.com")
                            .passwordHash("hashedpass")
                            .fullName("Stale Streak Tester")
                            .build());
        }

        UserLearningPreferences prefs =
                UserLearningPreferences.builder()
                        .userId(testUserId)
                        .currentStreak(5)
                        .longestStreak(5)
                        .lastActivityDate(LocalDate.now().minusDays(3))
                        .build();
        preferencesRepository.save(prefs);

        java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
        activityRecordingService.recordDailyPoints(testUserId, zone, 10);

        UserLearningPreferences updated =
                preferencesRepository.findByUserId(testUserId).orElseThrow();
        assertEquals(
                1,
                updated.getCurrentStreak(),
                "Stale streak should be expired to 0, then restarted at 1 after new activity!");
    }
}
