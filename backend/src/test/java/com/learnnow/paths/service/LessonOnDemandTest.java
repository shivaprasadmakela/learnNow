package com.learnnow.paths.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.learningprogress.entity.UserQuizAttempt;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import com.learnnow.paths.dto.response.LessonOutlineDto;
import com.learnnow.paths.dto.response.PathSummaryDto;
import com.learnnow.paths.dto.response.SubtopicDto;
import com.learnnow.paths.dto.response.TopicDetailDto;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Opening a topic used to send every lesson of it in full - text, code, quiz - before the learner
 * had read a line, and a list of paths carried their topics. Now each screen gets what it shows: a
 * topic is an outline, a lesson arrives when it is reached, and a quiz never carries its answers.
 */
@SpringBootTest
@Transactional
class LessonOnDemandTest extends AbstractIntegrationTest {

    private static final String USER = "lesson-on-demand-user";

    @Autowired private ContentAuthoringService authoring;
    @Autowired private CatalogService catalog;
    @Autowired private UserQuizAttemptRepository attempts;
    @Autowired private UserRepository users;

    @Test
    void aTopicIsAnOutlineAndALessonArrivesWhole() {
        AdminPathDto path = path("PUBLISHED", "PUBLISHED");
        UUID topicId = path.topics().get(0).id();

        TopicDetailDto topic = catalog.getTopicDetails(topicId, null).orElseThrow();
        assertThat(topic.subtopics())
                .extracting(LessonOutlineDto::title, LessonOutlineDto::quizCount)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Maps", 1));
        assertThat(names(LessonOutlineDto.class))
                .doesNotContain("content", "codeSnippets", "questions");

        SubtopicDto lesson = catalog.getLesson(topic.subtopics().get(0).id(), null).orElseThrow();
        assertThat(lesson.content()).isEqualTo("### How a map works");
        assertThat(lesson.codeSnippets())
                .singleElement()
                .satisfies(s -> assertThat(s.hasExpectedOutput()).isTrue());
        assertThat(lesson.questions())
                .singleElement()
                .satisfies(q -> assertThat(q.attempt()).isNull());
        // Nothing in a quiz question can carry its answer.
        assertThat(names(SubtopicDto.QuizQuestionDto.class))
                .noneMatch(
                        n ->
                                n.toLowerCase().contains("correct")
                                        || n.toLowerCase().contains("explanation"));
        assertThat(names(SubtopicDto.CodeSnippetDto.class)).doesNotContain("expectedOutput");
        assertThat(catalog.getExpectedOutput(lesson.id(), "s1")).contains("42");
        assertThat(catalog.getExpectedOutput(lesson.id(), "missing")).isEmpty();
    }

    @Test
    void anAnsweredQuestionComesBackWithItsResultAndTheAnswerOnlyWhenRight() {
        createUser();
        AdminPathDto path = path("PUBLISHED", "PUBLISHED");
        UUID lessonId = path.topics().get(0).subtopics().get(0).id();
        UUID questionId = catalog.getLesson(lessonId, USER).orElseThrow().questions().get(0).id();

        attempts.save(
                UserQuizAttempt.builder()
                        .userId(USER)
                        .questionId(questionId)
                        .correct(false)
                        .build());
        SubtopicDto.Attempt missed =
                catalog.getLesson(lessonId, USER).orElseThrow().questions().get(0).attempt();
        assertThat(missed.isCorrect()).isFalse();
        assertThat(missed.correctAnswer()).isNull();

        UserQuizAttempt a = attempts.findByUserIdAndQuestionId(USER, questionId).orElseThrow();
        a.setCorrect(true);
        attempts.save(a);
        SubtopicDto.Attempt right =
                catalog.getLesson(lessonId, USER).orElseThrow().questions().get(0).attempt();
        assertThat(right.correctAnswer()).isEqualTo("O(1)");
        assertThat(right.explanation()).isEqualTo("Hashing finds the bucket directly.");
    }

    @Test
    void aDraftLessonOrADraftPathIsNotServed() {
        AdminPathDto live = path("PUBLISHED", "DRAFT");
        assertThat(catalog.getLesson(live.topics().get(0).subtopics().get(0).id(), null)).isEmpty();

        AdminPathDto draft = path("DRAFT", "PUBLISHED");
        assertThat(catalog.getPathDetails(draft.id(), null)).isEmpty();
    }

    @Test
    void aPathSummaryIsCountsAndLinksNotTopics() {
        AdminPathDto path = path("PUBLISHED", "PUBLISHED");

        PathSummaryDto summary = catalog.getPathDetails(path.id(), null).orElseThrow();
        assertThat(summary.topicCount()).isEqualTo(1);
        assertThat(summary.interviewQuestionCount()).isZero();
        assertThat(summary.tracks()).isEmpty();
        assertThat(names(PathSummaryDto.class)).doesNotContain("topics");
    }

    private static List<String> names(Class<?> record) {
        return Arrays.stream(record.getRecordComponents()).map(RecordComponent::getName).toList();
    }

    private void createUser() {
        if (users.findById(USER).isEmpty()) {
            users.save(
                    User.builder()
                            .id(USER)
                            .email("lesson_on_demand@example.com")
                            .passwordHash("hashedpass")
                            .fullName("Lesson Tester")
                            .build());
        }
    }

    /** One topic, "Collections", with one lesson, "Maps": a snippet and a one-question quiz. */
    private AdminPathDto path(String pathStatus, String lessonStatus) {
        return authoring.saveOrUpdatePath(
                new AdminPathDto(
                        null,
                        "On demand " + UUID.randomUUID(),
                        "d",
                        "Backend",
                        "learnNow",
                        pathStatus,
                        List.of(
                                new AdminPathDto.AdminTopicDto(
                                        null,
                                        "Collections",
                                        "t",
                                        "course",
                                        "1 hour",
                                        1,
                                        "PUBLISHED",
                                        List.of(
                                                new AdminPathDto.AdminSubtopicDto(
                                                        null,
                                                        "Maps",
                                                        "### How a map works",
                                                        1,
                                                        lessonStatus,
                                                        "beginner",
                                                        "concept",
                                                        List.of(),
                                                        null,
                                                        5,
                                                        List.of(
                                                                new AdminPathDto
                                                                        .AdminCodeSnippetDto(
                                                                        "s1",
                                                                        "java",
                                                                        "Run it",
                                                                        "System.out.println(42);",
                                                                        "42",
                                                                        true,
                                                                        false,
                                                                        1)),
                                                        List.of(
                                                                new AdminPathDto
                                                                        .AdminQuizQuestionDto(
                                                                        null,
                                                                        "mcq",
                                                                        "How fast is a lookup?",
                                                                        List.of("O(1)", "O(n)"),
                                                                        "O(1)",
                                                                        "Hashing finds the bucket"
                                                                                + " directly.",
                                                                        5))))))));
    }
}
