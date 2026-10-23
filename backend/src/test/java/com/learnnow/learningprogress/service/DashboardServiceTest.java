package com.learnnow.learningprogress.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.learningprogress.dto.response.DashboardResponse;
import com.learnnow.learningprogress.dto.response.RecentTopicActivity;
import com.learnnow.learningprogress.dto.response.WeeklyLeaderboardEntry;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * The dashboard used to load every published path with its topics, every lesson of each recent
 * topic - content included - and the learner's whole lesson history, to name five topics. It now
 * asks only for counts. These cases pin the figures it shows and that its cost does not grow with
 * how much content there is or how much of it a learner has done.
 */
@SpringBootTest
@Transactional
class DashboardServiceTest extends AbstractIntegrationTest {

    @Autowired private DashboardService dashboard;
    @Autowired private ProgressService progress;
    @Autowired private ContentAuthoringService authoring;
    @Autowired private PathRepository pathRepository;
    @Autowired private UserRepository users;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @Autowired private EntityManager entityManager;

    @Test
    void aRecentTopicsProgressCountsOnlyPublishedLessons() {
        String user = learner();
        // Two published lessons and a draft: one done is half, not a third.
        AdminPathDto path = path("Recent " + UUID.randomUUID(), 1, 2, 1);
        progress.markSubtopicComplete(user, lesson(path, 0, 0), true);

        DashboardResponse response = dashboard.buildDashboard(user);

        assertThat(response.recentTopics()).hasSize(1);
        RecentTopicActivity recent = response.recentTopics().get(0);
        assertThat(recent.topicId()).isEqualTo(path.topics().get(0).id());
        assertThat(recent.topicTitle()).isEqualTo("Topic 1");
        assertThat(recent.pathId()).isEqualTo(path.id());
        assertThat(recent.pathTitle()).isEqualTo(path.title());
        assertThat(recent.progressPercentage()).isEqualTo(50);
        assertThat(recent.completed()).isFalse();
    }

    @Test
    void theOverallCardsPathCountsComeWithTheDashboard() {
        String user = learner();
        AdminPathDto path = path("Finish " + UUID.randomUUID(), 1, 2, 0);

        DashboardResponse before = dashboard.buildDashboard(user);
        assertThat(before.publishedPathsCount())
                .isEqualTo(pathRepository.findByStatus(ContentStatus.PUBLISHED).size());
        assertThat(before.completedPathsCount()).isZero();

        progress.markSubtopicComplete(user, lesson(path, 0, 0), true);
        progress.markSubtopicComplete(user, lesson(path, 0, 1), true);

        assertThat(dashboard.buildDashboard(user).completedPathsCount()).isEqualTo(1);
    }

    @Test
    void leaderboardRowsCarryNoUserIds() {
        assertThat(
                        Arrays.stream(WeeklyLeaderboardEntry.class.getRecordComponents())
                                .map(RecordComponent::getName))
                .doesNotContain("userId");
    }

    @Test
    void costsTheSameQueriesForALargePathAsForASmallOne() {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);

        long small =
                statementsForLearnerHalfwayThrough(path("Small " + UUID.randomUUID(), 2, 2, 0));
        long large =
                statementsForLearnerHalfwayThrough(path("Large " + UUID.randomUUID(), 7, 4, 1));

        assertThat(small).as("statement statistics are not being recorded").isPositive();
        assertThat(large)
                .as("the dashboard's cost grew with content (%d small, %d large)", small, large)
                .isEqualTo(small);
    }

    /** A fresh learner with the first lesson of every topic done, and what the dashboard cost. */
    private long statementsForLearnerHalfwayThrough(AdminPathDto path) {
        String user = learner();
        for (int topic = 0; topic < path.topics().size(); topic++) {
            progress.markSubtopicComplete(user, lesson(path, topic, 0), true);
        }
        // The fixtures' own writes would otherwise be flushed by the first query, and counted.
        entityManager.flush();
        entityManager.clear();
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        DashboardResponse response = dashboard.buildDashboard(user);
        assertThat(response.banner().type()).isEqualTo("CONTINUE");
        return statistics.getPrepareStatementCount();
    }

    private String learner() {
        String user = "DASHBOARD_" + UUID.randomUUID().toString().substring(0, 8);
        users.save(
                User.builder()
                        .id(user)
                        .email(user.toLowerCase() + "@example.com")
                        .passwordHash("x")
                        .fullName("Dashboard")
                        .build());
        return user;
    }

    private static UUID lesson(AdminPathDto path, int topic, int index) {
        return path.topics().get(topic).subtopics().get(index).id();
    }

    /**
     * {@code topics} topics of {@code published} published lessons each, followed by {@code drafts}
     * draft ones.
     */
    private AdminPathDto path(String title, int topics, int published, int drafts) {
        List<AdminPathDto.AdminTopicDto> topicDtos =
                IntStream.rangeClosed(1, topics)
                        .mapToObj(
                                t ->
                                        new AdminPathDto.AdminTopicDto(
                                                null,
                                                "Topic " + t,
                                                "t",
                                                "course",
                                                "1 hour",
                                                t,
                                                "PUBLISHED",
                                                IntStream.rangeClosed(1, published + drafts)
                                                        .mapToObj(
                                                                i ->
                                                                        lessonDto(
                                                                                i,
                                                                                i <= published
                                                                                        ? "PUBLISHED"
                                                                                        : "DRAFT"))
                                                        .toList()))
                        .toList();
        return authoring.saveOrUpdatePath(
                new AdminPathDto(null, title, "d", "Backend", "learnNow", "PUBLISHED", topicDtos));
    }

    private static AdminPathDto.AdminSubtopicDto lessonDto(int order, String status) {
        return new AdminPathDto.AdminSubtopicDto(
                null,
                "Lesson " + order,
                "### Body",
                order,
                status,
                "beginner",
                "concept",
                List.of(),
                null,
                5,
                List.of(),
                List.of());
    }
}
