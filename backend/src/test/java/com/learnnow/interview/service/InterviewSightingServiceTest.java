package com.learnnow.interview.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.dto.request.ImportInterviewBankRequest;
import com.learnnow.interview.dto.request.ImportInterviewBankRequest.Question;
import com.learnnow.interview.dto.request.RecordSightingRequest;
import com.learnnow.interview.dto.response.InterviewQuestionDto;
import com.learnnow.interview.dto.response.SightingResultDto;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.interview.repository.InterviewReportRepository;
import java.lang.reflect.RecordComponent;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * "Asked at Flipkart" is a claim learners will believe, so a sighting has to be well-formed to be
 * recorded at all, one interview must not count twice, and where it was read must never reach a
 * learner.
 */
@SpringBootTest
@Transactional
class InterviewSightingServiceTest extends AbstractIntegrationTest {

    /** "Now" is mid-October 2026, so September is past and November is not. */
    private static final Clock OCTOBER_2026 =
            Clock.fixed(Instant.parse("2026-10-15T10:00:00Z"), ZoneOffset.UTC);

    @Autowired private InterviewService interview;
    @Autowired private InterviewReportRepository reports;
    @Autowired private InterviewQuestionRepository questions;
    @Autowired private ContentAuthoringService authoring;

    private InterviewSightingService sightings;
    private String p;
    private UUID lesson;

    @BeforeEach
    void bank() {
        sightings = new InterviewSightingService(reports, questions, OCTOBER_2026);
        p = "s" + UUID.randomUUID().toString().substring(0, 8) + "-";
        AdminPathDto path = path();
        lesson = path.topics().get(0).subtopics().get(0).id();
        interview.importBank(
                new ImportInterviewBankRequest(
                        "test",
                        path.title(),
                        List.of(
                                q(p + "map", "Lesson", List.of(q(p + "collide", null, List.of()))),
                                q(p + "other", "Lesson", List.of()))));
    }

    @Test
    void aSightingTurnsAQuestionFromPracticeIntoAskedAt() {
        sightings.record(sighting("Flipkart", "2026-09", "https://example.com/post/1", p + "map"));

        InterviewQuestionDto map = opener("map");
        assertThat(map.practice()).isFalse();
        assertThat(map.sightings())
                .singleElement()
                .satisfies(
                        s -> {
                            assertThat(s.company()).isEqualTo("Flipkart");
                            assertThat(s.round()).isEqualTo("Onsite");
                            assertThat(s.seenMonth()).isEqualTo(LocalDate.of(2026, 9, 1));
                        });
        assertThat(opener("other").practice()).isTrue();
    }

    @Test
    void aFollowUpCanBeConfirmedWithoutItsOpener() {
        sightings.record(sighting("Swiggy", "2026-08", null, p + "collide"));

        InterviewQuestionDto map = opener("map");
        assertThat(map.practice()).isTrue();
        assertThat(map.followUps().get(0).practice()).isFalse();
    }

    @Test
    void theSameSourceAddsToOneReportInsteadOfCountingTwice() {
        String post = "https://example.com/post/2";
        SightingResultDto first =
                sightings.record(sighting("Flipkart", "2026-09", post, p + "map"));
        SightingResultDto second =
                sightings.record(sighting("flipkart", "2026-09", post, p + "map", p + "other"));

        assertThat(second.reportId()).isEqualTo(first.reportId());
        assertThat(second.newReport()).isFalse();
        assertThat(second.questionsLinked()).isEqualTo(1);
        assertThat(second.alreadyLinked()).isEqualTo(1);
        assertThat(opener("map").sightings()).hasSize(1);
    }

    @Test
    void aSourceAlreadyRecordedForAnotherCompanyIsRejected() {
        String post = "https://example.com/post/3";
        sightings.record(sighting("Flipkart", "2026-09", post, p + "map"));

        assertThatThrownBy(() -> sightings.record(sighting("Amazon", "2026-09", post, p + "other")))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("already exists for Flipkart, 2026-09");
    }

    @Test
    void aMalformedSightingIsRejectedWithEveryProblemNamed() {
        assertThatThrownBy(
                        () ->
                                sightings.record(
                                        sighting(
                                                " ",
                                                "2026-11",
                                                "linkedin.com/posts/123",
                                                p + "map",
                                                "no-such-question")))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("a company is required")
                .hasMessageContaining("2026-11 has not happened yet")
                .hasMessageContaining("is not an http(s) link")
                .hasMessageContaining("no question has the key \"no-such-question\"");
        assertThat(opener("map").practice()).isTrue();
    }

    @Test
    void whereASightingWasReadHasNoWayToReachALearner() {
        assertThat(Arrays.stream(InterviewQuestionDto.Sighting.class.getRecordComponents()))
                .extracting(RecordComponent::getName)
                .noneMatch(name -> name.toLowerCase().contains("source"))
                .noneMatch(name -> name.toLowerCase().contains("url"));
    }

    private InterviewQuestionDto opener(String key) {
        String prompt = "Prompt " + key + "?";
        return interview.forSubtopic(lesson).stream()
                .filter(q -> q.prompt().equals(prompt))
                .findFirst()
                .orElseThrow();
    }

    private static RecordSightingRequest sighting(
            String company, String month, String source, String... keys) {
        return new RecordSightingRequest(
                company, "SDE-2", "Mid", "Onsite", month, source, List.of(keys));
    }

    private Question q(String key, String subtopic, List<Question> follow) {
        String bare = key.substring(p.length());
        return new Question(key, subtopic, null, "Prompt " + bare + "?", "s", "d", "g", follow);
    }

    private AdminPathDto path() {
        return authoring.saveOrUpdatePath(
                new AdminPathDto(
                        null,
                        "Sightings " + UUID.randomUUID(),
                        "d",
                        "Backend",
                        "learnNow",
                        "PUBLISHED",
                        List.of(
                                new AdminPathDto.AdminTopicDto(
                                        null,
                                        "Maps",
                                        "t",
                                        "course",
                                        "1 hour",
                                        1,
                                        "PUBLISHED",
                                        List.of(
                                                new AdminPathDto.AdminSubtopicDto(
                                                        null,
                                                        "Lesson",
                                                        "### Body",
                                                        1,
                                                        "PUBLISHED",
                                                        "beginner",
                                                        "concept",
                                                        List.of(),
                                                        null,
                                                        5,
                                                        List.of(),
                                                        List.of()))))));
    }
}
