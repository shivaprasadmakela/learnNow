package com.learnnow.learningprogress.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.learningprogress.dto.response.DashboardBanner;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.tracks.dto.request.ImportTrackRequest;
import com.learnnow.tracks.service.TrackService;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * The dashboard card used to recommend "the first path" from an unordered query, ignore lessons a
 * learner was halfway through, and call a path "Review" when it was not finished. Each case here is
 * one of those.
 */
@SpringBootTest
@Transactional
class NextStepServiceTest extends AbstractIntegrationTest {

    @Autowired private NextStepService nextStep;
    @Autowired private ContentAuthoringService authoring;
    @Autowired private TrackService tracks;
    @Autowired private UserRepository users;
    @Autowired private UserSubtopicProgressRepository progress;

    private String user;
    private AdminPathDto first;
    private AdminPathDto second;
    private String trackTitle;

    @BeforeEach
    void route() {
        user = "NEXT_STEP_" + UUID.randomUUID().toString().substring(0, 8);
        users.save(
                User.builder()
                        .id(user)
                        .email(user.toLowerCase() + "@example.com")
                        .passwordHash("x")
                        .fullName("Next Step")
                        .build());
        first = path("First " + UUID.randomUUID(), 2);
        second = path("Second " + UUID.randomUUID(), 1);
        String slug = "next-step-" + UUID.randomUUID().toString().substring(0, 8);
        trackTitle = "Track " + slug;
        // Ordered before any other track, so it is the one a newcomer starts on.
        tracks.importTrack(
                new ImportTrackRequest(
                        slug,
                        trackTitle,
                        "d",
                        -1000,
                        List.of(
                                new ImportTrackRequest.Step(first.title(), false, null),
                                new ImportTrackRequest.Step(second.title(), false, null))));
    }

    @Test
    void aNewcomerStartsOnTheFirstLessonOfTheFirstTrack() {
        DashboardBanner card = nextStep.forUser(user);

        assertThat(card.type()).isEqualTo("START");
        assertThat(card.pathId()).isEqualTo(first.id());
        assertThat(card.nextLesson().subtopicId()).isEqualTo(lesson(first, 0));
        assertThat(card.reason()).contains(trackTitle);
    }

    @Test
    void aLearnerHalfwayThroughAPathContinuesFromTheirNextLesson() {
        complete(first, 0, Instant.now());

        DashboardBanner card = nextStep.forUser(user);

        assertThat(card.type()).isEqualTo("CONTINUE");
        assertThat(card.pathId()).isEqualTo(first.id());
        assertThat(card.nextLesson().subtopicId()).isEqualTo(lesson(first, 1));
    }

    @Test
    void finishingAPathRecommendsTheNextStepOfItsTrack() {
        complete(first, 0, Instant.now().minusSeconds(60));
        complete(first, 1, Instant.now());

        DashboardBanner card = nextStep.forUser(user);

        assertThat(card.type()).isEqualTo("NEXT");
        assertThat(card.pathId()).isEqualTo(second.id());
        assertThat(card.nextLesson().subtopicId()).isEqualTo(lesson(second, 0));
        assertThat(card.reason()).contains(first.title()).contains(trackTitle);
    }

    @Test
    void theCardFollowsTheMostRecentLessonNotTheFirstPathStarted() {
        complete(first, 0, Instant.now().minusSeconds(3600));
        complete(second, 0, Instant.now().minusSeconds(60)); // finishes second, the latest work

        DashboardBanner card = nextStep.forUser(user);

        // Second is done, so its track points back to the unfinished first path.
        assertThat(card.type()).isEqualTo("NEXT");
        assertThat(card.pathId()).isEqualTo(first.id());
        assertThat(card.nextLesson().subtopicId()).isEqualTo(lesson(first, 1));
    }

    private UUID lesson(AdminPathDto path, int index) {
        return path.topics().get(0).subtopics().get(index).id();
    }

    private void complete(AdminPathDto path, int index, Instant at) {
        progress.save(
                UserSubtopicProgress.builder()
                        .userId(user)
                        .topicId(path.topics().get(0).id())
                        .subtopicId(lesson(path, index))
                        .completed(true)
                        .completedAt(at)
                        .build());
    }

    /** One topic of {@code lessons} published lessons. */
    private AdminPathDto path(String title, int lessons) {
        List<AdminPathDto.AdminSubtopicDto> subs =
                java.util.stream.IntStream.rangeClosed(1, lessons)
                        .mapToObj(
                                i ->
                                        new AdminPathDto.AdminSubtopicDto(
                                                null,
                                                "Lesson " + i,
                                                "### Body",
                                                i,
                                                "PUBLISHED",
                                                "beginner",
                                                "concept",
                                                List.of(),
                                                null,
                                                5,
                                                List.of(),
                                                List.of()))
                        .toList();
        return authoring.saveOrUpdatePath(
                new AdminPathDto(
                        null,
                        title,
                        "d",
                        "Backend",
                        "learnNow",
                        "PUBLISHED",
                        List.of(
                                new AdminPathDto.AdminTopicDto(
                                        null,
                                        "Topic",
                                        "t",
                                        "course",
                                        "1 hour",
                                        1,
                                        "PUBLISHED",
                                        subs))));
    }
}
