package com.learnnow.tracks.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.tracks.dto.request.ImportTrackRequest;
import com.learnnow.tracks.dto.response.TrackDetailDto;
import com.learnnow.tracks.dto.response.TrackSummaryDto;
import com.learnnow.tracks.repository.TrackRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tracks are routes through paths, so most of what can go wrong is in the joins: a step pointing at
 * the wrong path, a draft path leaking onto a roadmap, an optional step counted in the time it
 * takes, or "continue" sending a learner somewhere other than their first unfinished lesson.
 */
@SpringBootTest
@Transactional
class TrackServiceTest extends AbstractIntegrationTest {

    private static final String USER = "TRACK_TEST_USER";

    @Autowired private TrackService tracks;
    @Autowired private TrackRepository trackRepository;
    @Autowired private ContentAuthoringService authoring;
    @Autowired private UserRepository userRepository;
    @Autowired private UserSubtopicProgressRepository progressRepository;

    @Test
    void anImportNamingUnknownOrRepeatedPathsIsRejectedWithEveryProblemAtOnce() {
        AdminPathDto java = path("Java " + UUID.randomUUID(), "PUBLISHED", 1);
        String slug = slug();

        assertThatThrownBy(
                        () ->
                                tracks.importTrack(
                                        track(
                                                slug,
                                                step("No Such Path", false),
                                                step(java.title(), false),
                                                step(java.title().toUpperCase(), false))))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("no path is titled \"No Such Path\"")
                .hasMessageContaining("is listed more than once");
        assertThat(trackRepository.findBySlug(slug)).isEmpty();
    }

    @Test
    void aTrackOfOnlyOptionalStepsIsRejected() {
        AdminPathDto java = path("Java " + UUID.randomUUID(), "PUBLISHED", 1);

        assertThatThrownBy(() -> tracks.importTrack(track(slug(), step(java.title(), true))))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("at least one step that is not optional");
    }

    @Test
    void reimportingASlugReplacesItsStepsInTheNewOrder() {
        AdminPathDto first = path("First " + UUID.randomUUID(), "PUBLISHED", 1);
        AdminPathDto second = path("Second " + UUID.randomUUID(), "PUBLISHED", 1);
        String slug = slug();

        assertThat(
                        tracks.importTrack(
                                        track(
                                                slug,
                                                step(first.title(), false),
                                                step(second.title(), true)))
                                .mode())
                .isEqualTo("CREATED");
        assertThat(
                        tracks.importTrack(
                                        track(
                                                slug,
                                                step(second.title(), false),
                                                step(first.title(), false)))
                                .mode())
                .isEqualTo("UPDATED");

        TrackDetailDto detail = tracks.getTrack(slug, null).orElseThrow();
        assertThat(detail.steps())
                .extracting(
                        TrackDetailDto.Step::stepNumber,
                        TrackDetailDto.Step::title,
                        TrackDetailDto.Step::optional)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(1, second.title(), false),
                        org.assertj.core.groups.Tuple.tuple(2, first.title(), false));
    }

    @Test
    void theCatalogTimesRequiredStepsSeparatelyAndLeavesOutDraftPaths() {
        AdminPathDto core = path("Core " + UUID.randomUUID(), "PUBLISHED", 2);
        AdminPathDto extra = path("Extra " + UUID.randomUUID(), "PUBLISHED", 1);
        AdminPathDto unfinished = path("Unfinished " + UUID.randomUUID(), "DRAFT", 3);
        String slug = slug();
        tracks.importTrack(
                track(
                        slug,
                        step(core.title(), false),
                        step(unfinished.title(), false),
                        step(extra.title(), true)));

        TrackSummaryDto summary =
                tracks.listTracks(null).stream()
                        .filter(t -> t.slug().equals(slug))
                        .findFirst()
                        .orElseThrow();

        assertThat(summary.steps())
                .extracting(TrackSummaryDto.StepRef::title)
                .containsExactly(core.title(), extra.title());
        assertThat(summary.stepCount()).isEqualTo(2);
        assertThat(summary.optionalStepCount()).isEqualTo(1);
        assertThat(summary.estimatedMinutes()).isEqualTo(10); // two 5-minute lessons
        assertThat(summary.optionalMinutes()).isEqualTo(5);
        assertThat(summary.topicCount()).isEqualTo(1);
        assertThat(summary.progressPercentage()).isNull();
    }

    @Test
    void progressFollowsCompletedLessonsAndContinueMovesOnToTheNextStep() {
        createUser();
        AdminPathDto core = path("Core " + UUID.randomUUID(), "PUBLISHED", 2);
        AdminPathDto extra = path("Extra " + UUID.randomUUID(), "PUBLISHED", 1);
        String slug = slug();
        tracks.importTrack(track(slug, step(core.title(), false), step(extra.title(), true)));

        AdminPathDto.AdminTopicDto coreTopic = core.topics().get(0);
        complete(coreTopic, 0);

        TrackDetailDto halfway = tracks.getTrack(slug, USER).orElseThrow();
        assertThat(halfway.steps())
                .extracting(TrackDetailDto.Step::progressPercentage)
                .containsExactly(50, 0);
        // Only the required step counts towards the track.
        assertThat(halfway.progressPercentage()).isEqualTo(50);
        assertThat(halfway.nextLesson().subtopicId()).isEqualTo(coreTopic.subtopics().get(1).id());

        complete(coreTopic, 1);

        TrackDetailDto requiredDone = tracks.getTrack(slug, USER).orElseThrow();
        assertThat(requiredDone.progressPercentage()).isEqualTo(100);
        assertThat(requiredDone.nextLesson().pathTitle()).isEqualTo(extra.title());

        complete(extra.topics().get(0), 0);

        assertThat(tracks.getTrack(slug, USER).orElseThrow().nextLesson()).isNull();
    }

    @Test
    void aVisitorSeesTheRoadmapWithoutProgressOrANextLesson() {
        AdminPathDto core = path("Core " + UUID.randomUUID(), "PUBLISHED", 1);
        String slug = slug();
        tracks.importTrack(track(slug, step(core.title(), false)));

        TrackDetailDto detail = tracks.getTrack(slug, null).orElseThrow();

        assertThat(detail.progressPercentage()).isNull();
        assertThat(detail.steps().get(0).progressPercentage()).isNull();
        assertThat(detail.nextLesson()).isNull();
        assertThat(tracks.getTrack("no-such-track", null)).isEmpty();
    }

    private void complete(AdminPathDto.AdminTopicDto topic, int lesson) {
        progressRepository.save(
                UserSubtopicProgress.builder()
                        .userId(USER)
                        .topicId(topic.id())
                        .subtopicId(topic.subtopics().get(lesson).id())
                        .completed(true)
                        .build());
    }

    private void createUser() {
        if (userRepository.findById(USER).isEmpty()) {
            userRepository.save(
                    User.builder()
                            .id(USER)
                            .email("track_test@example.com")
                            .passwordHash("hashedpass")
                            .fullName("Track Tester")
                            .build());
        }
    }

    private static String slug() {
        return "track-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static ImportTrackRequest track(String slug, ImportTrackRequest.Step... steps) {
        return new ImportTrackRequest(slug, "Track " + slug, "A route", 0, List.of(steps));
    }

    private static ImportTrackRequest.Step step(String path, boolean optional) {
        return new ImportTrackRequest.Step(path, optional, null);
    }

    /** A path with one topic holding {@code lessons} published five-minute lessons. */
    private AdminPathDto path(String title, String status, int lessons) {
        List<AdminPathDto.AdminSubtopicDto> subtopics = new ArrayList<>();
        for (int i = 1; i <= lessons; i++) {
            subtopics.add(
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
                            List.of()));
        }
        return authoring.saveOrUpdatePath(
                new AdminPathDto(
                        null,
                        title,
                        "d",
                        "Backend",
                        "learnNow",
                        status,
                        List.of(
                                new AdminPathDto.AdminTopicDto(
                                        null,
                                        "Topic",
                                        "t",
                                        "course",
                                        "1 hour",
                                        1,
                                        "PUBLISHED",
                                        subtopics))));
    }
}
