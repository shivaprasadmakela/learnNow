package com.learnnow.interview.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.dto.request.ImportInterviewBankRequest;
import com.learnnow.interview.dto.request.ImportInterviewBankRequest.Question;
import com.learnnow.interview.dto.response.InterviewAnswerDto;
import com.learnnow.interview.dto.response.InterviewImportResultDto;
import com.learnnow.interview.dto.response.InterviewQuestionDto;
import com.learnnow.interview.dto.response.InterviewTopicDto;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * An interview bank is a forest of follow-up chains hung off lessons. What can go wrong is
 * structural: a chain deeper than a real round, a key used twice, an opener pointing at a lesson
 * that does not exist, or a re-import that duplicates questions instead of editing them.
 */
@SpringBootTest
@Transactional
class InterviewServiceTest extends AbstractIntegrationTest {

    @Autowired private InterviewService interview;
    @Autowired private InterviewQuestionRepository questions;
    @Autowired private ContentAuthoringService authoring;

    @Test
    void aPathListsItsTopicsWithCountsAndNoQuestions() {
        AdminPathDto path = path("PUBLISHED");
        String p = prefix();
        interview.importBank(
                bank(
                        path,
                        root(p + "late", "Second lesson", "Asked later?"),
                        root(
                                p + "map",
                                "First lesson",
                                "How does a map find a key?",
                                follow(
                                        p + "collide",
                                        "What happens on a collision?",
                                        follow(p + "tree", "Why switch to a tree?")))));

        List<InterviewTopicDto> topics = interview.forPath(path.id()).orElseThrow();

        assertThat(topics)
                .extracting(
                        InterviewTopicDto::topicTitle,
                        InterviewTopicDto::questionCount,
                        InterviewTopicDto::followUpCount)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Maps", 1, 2),
                        org.assertj.core.groups.Tuple.tuple("Sets", 1, 0));
    }

    @Test
    void aTopicGivesPromptsAndEachRevealGivesOneAnswerAndTheNextFollowUps() {
        AdminPathDto path = path("PUBLISHED");
        String p = prefix();
        interview.importBank(
                bank(
                        path,
                        root(
                                p + "map",
                                "First lesson",
                                "How does a map find a key?",
                                follow(
                                        p + "collide",
                                        "What happens on a collision?",
                                        follow(p + "tree", "Why switch to a tree?")))));

        InterviewQuestionDto opener = interview.forTopic(path.topics().get(0).id()).get(0);
        assertThat(opener.prompt()).isEqualTo("How does a map find a key?");
        assertThat(opener.subtopicTitle()).isEqualTo("First lesson");
        assertThat(opener.depth()).isEqualTo(1);
        assertThat(opener.practice()).isTrue();
        assertThat(opener.followUpCount()).isEqualTo(1);
        // A prompt carries nothing that answers it: the answer is a separate reveal.
        assertThat(Arrays.stream(InterviewQuestionDto.class.getRecordComponents()))
                .extracting(RecordComponent::getName)
                .noneMatch(name -> name.toLowerCase().contains("answer"))
                .doesNotContain("followUps");

        InterviewAnswerDto revealed = interview.answer(opener.id()).orElseThrow();
        assertThat(revealed.answerShort()).isEqualTo("short");
        InterviewQuestionDto collide = revealed.followUps().get(0);
        assertThat(collide.depth()).isEqualTo(2);
        // Follow-ups share their opener's lesson rather than repeating it.
        assertThat(collide.subtopicId()).isNull();
        assertThat(collide.followUpCount()).isEqualTo(1);

        assertThat(interview.answer(collide.id()).orElseThrow().followUps())
                .extracting(InterviewQuestionDto::prompt, InterviewQuestionDto::depth)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Why switch to a tree?", 3));
        assertThat(interview.answer(UUID.randomUUID())).isEmpty();
    }

    @Test
    void questionsOfADraftLessonStayHidden() {
        AdminPathDto path = path("PUBLISHED");
        String p = prefix();
        interview.importBank(bank(path, root(p + "hidden", "Second lesson", "Hidden?")));
        UUID hidden = questions.findByQuestionKeyIn(List.of(p + "hidden")).get(0).getId();
        AdminPathDto.AdminTopicDto sets = path.topics().get(1);
        AdminPathDto.AdminSubtopicDto lesson = sets.subtopics().get(0);
        authoring.saveOrUpdatePath(
                new AdminPathDto(
                        path.id(),
                        path.title(),
                        path.description(),
                        path.category(),
                        path.managedBy(),
                        path.status(),
                        List.of(
                                path.topics().get(0),
                                new AdminPathDto.AdminTopicDto(
                                        sets.id(),
                                        sets.title(),
                                        sets.description(),
                                        sets.category(),
                                        sets.duration(),
                                        sets.orderIndex(),
                                        sets.status(),
                                        List.of(
                                                new AdminPathDto.AdminSubtopicDto(
                                                        lesson.id(),
                                                        lesson.title(),
                                                        lesson.content(),
                                                        lesson.orderIndex(),
                                                        "DRAFT",
                                                        lesson.level(),
                                                        lesson.track(),
                                                        lesson.prerequisites(),
                                                        lesson.videoUrl(),
                                                        lesson.estimatedMinutes(),
                                                        lesson.codeSnippets(),
                                                        lesson.questions()))))));

        assertThat(interview.forPath(path.id()).orElseThrow()).isEmpty();
        assertThat(interview.answer(hidden)).isEmpty();
    }

    @Test
    void aBankWithProblemsIsRejectedWholeWithEveryProblemNamed() {
        AdminPathDto path = path("PUBLISHED");
        String p = prefix();

        assertThatThrownBy(
                        () ->
                                interview.importBank(
                                        bank(
                                                path,
                                                root(p + "a", "No such lesson", "Q?"),
                                                root(
                                                        p + "b",
                                                        "First lesson",
                                                        "Q?",
                                                        follow(
                                                                p + "b",
                                                                "Same key again?",
                                                                follow(
                                                                        p + "c",
                                                                        "Third?",
                                                                        follow(
                                                                                p + "d",
                                                                                "Fourth level?")))),
                                                legacy(
                                                        "Not A Key",
                                                        "First lesson",
                                                        "Q?",
                                                        " ",
                                                        null))))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("no subtopic titled \"No such lesson\"")
                .hasMessageContaining("appears more than once")
                .hasMessageContaining("follow-ups stop at 3")
                .hasMessageContaining("is not lower-case-hyphenated")
                .hasMessageContaining("needs a complete answer");

        assertThat(questions.findByQuestionKeyIn(List.of(p + "a", p + "b", p + "c"))).isEmpty();
    }

    @Test
    void reimportingABankEditsItsQuestionsInPlace() {
        AdminPathDto path = path("PUBLISHED");
        String p = prefix();
        interview.importBank(
                bank(path, root(p + "map", "First lesson", "Old wording?", follow(p + "f", "F?"))));
        UUID id = questions.findByQuestionKeyIn(List.of(p + "map")).get(0).getId();

        InterviewImportResultDto result =
                interview.importBank(
                        bank(
                                path,
                                root(
                                        p + "map",
                                        "First lesson",
                                        "New wording?",
                                        follow(p + "f", "F?"))));

        assertThat(result.created()).isZero();
        assertThat(result.updated()).isEqualTo(2);
        assertThat(questions.findByQuestionKeyIn(List.of(p + "map")))
                .singleElement()
                .satisfies(
                        q -> {
                            assertThat(q.getId()).isEqualTo(id);
                            assertThat(q.getPrompt()).isEqualTo("New wording?");
                        });
    }

    @Test
    void aTopicListsItsQuestionsInLessonOrderNotImportOrder() {
        AdminPathDto path =
                authoring.saveOrUpdatePath(
                        new AdminPathDto(
                                null,
                                "Interview " + UUID.randomUUID(),
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
                                                        lesson("First lesson", 1),
                                                        lesson("Second lesson", 2))))));
        String p = prefix();
        interview.importBank(
                bank(
                        path,
                        root(p + "two", "Second lesson", "Two?"),
                        root(p + "one", "First lesson", "One?")));

        List<InterviewQuestionDto> questions = interview.forTopic(path.topics().get(0).id());

        assertThat(questions)
                .extracting(InterviewQuestionDto::prompt)
                .containsExactly("One?", "Two?");
        assertThat(questions)
                .extracting(InterviewQuestionDto::subtopicTitle)
                .containsExactly("First lesson", "Second lesson");
        assertThat(interview.forTopic(UUID.randomUUID())).isEmpty();
    }

    @Test
    void aBeginnerAnswerImportsAndReadsBackInItsSections() {
        AdminPathDto path = path("PUBLISHED");
        String key = prefix() + "profiles";
        interview.importBank(
                bank(
                        path,
                        new Question(
                                key,
                                "First lesson",
                                null,
                                "How do you run one app with different settings per environment?",
                                "Spring **profiles** pick a set of settings per environment.",
                                "Put shared settings in `application.properties` and the rest in"
                                        + " `application-dev.properties`:\n\n"
                                        + "```properties\n"
                                        + "server.port=8080\n"
                                        + "```",
                                "```bash\njava -jar app.jar --spring.profiles.active=dev\n```",
                                "- Development uses your local database.",
                                "I use Spring Profiles, one properties file per environment.",
                                "Same code, different configuration.",
                                "Keep passwords out of the files.",
                                null,
                                null,
                                null,
                                List.of())));

        InterviewAnswerDto q =
                interview
                        .answer(
                                interview.forTopic(path.topics().get(0).id()).stream()
                                        .filter(
                                                x ->
                                                        x.prompt()
                                                                .startsWith(
                                                                        "How do you run one app"))
                                        .findFirst()
                                        .orElseThrow()
                                        .id())
                        .orElseThrow();

        assertThat(q.answer().simple()).contains("**profiles**");
        assertThat(q.answer().how()).contains("```properties");
        assertThat(q.answer().usage()).contains("--spring.profiles.active=dev");
        assertThat(q.answer().script()).startsWith("I use");
        assertThat(q.answer().remember()).isEqualTo("Same code, different configuration.");
        assertThat(q.answerShort()).isNull();
    }

    @Test
    void aHalfRewrittenQuestionKeepsShowingItsCompleteEarlierAnswer() {
        AdminPathDto path = path("PUBLISHED");
        interview.importBank(
                bank(
                        path,
                        new Question(
                                prefix() + "half",
                                "First lesson",
                                null,
                                "Half rewritten?",
                                "Only the first section is written so far.",
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                "short",
                                "deep",
                                "signal",
                                List.of())));

        InterviewAnswerDto q =
                interview
                        .answer(
                                interview.forTopic(path.topics().get(0).id()).stream()
                                        .filter(x -> x.prompt().equals("Half rewritten?"))
                                        .findFirst()
                                        .orElseThrow()
                                        .id())
                        .orElseThrow();

        assertThat(q.answer()).isNull();
        assertThat(q.answerShort()).isEqualTo("short");
    }

    @Test
    void aDraftPathHasNoInterviewBank() {
        AdminPathDto path = path("DRAFT");
        interview.importBank(bank(path, root(prefix() + "q", "First lesson", "Q?")));

        assertThat(interview.forPath(path.id())).isEmpty();
    }

    private static String prefix() {
        return "t" + UUID.randomUUID().toString().substring(0, 8) + "-";
    }

    private static ImportInterviewBankRequest bank(AdminPathDto path, Question... roots) {
        return new ImportInterviewBankRequest("test-bank", path.title(), List.of(roots));
    }

    private static Question root(String key, String subtopic, String prompt, Question... follow) {
        return legacy(key, subtopic, prompt, "short", List.of(follow));
    }

    private static Question follow(String key, String prompt, Question... follow) {
        return legacy(key, null, prompt, "short", List.of(follow));
    }

    /** A question with the earlier three-part answer. */
    static Question legacy(
            String key, String subtopic, String prompt, String shortAnswer, List<Question> follow) {
        return new Question(
                key,
                subtopic,
                null,
                prompt,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                shortAnswer,
                "deep",
                "signal",
                follow);
    }

    private static AdminPathDto.AdminSubtopicDto lesson(String title, int order) {
        return new AdminPathDto.AdminSubtopicDto(
                null,
                title,
                "### Body",
                order,
                "PUBLISHED",
                "beginner",
                "concept",
                List.of(),
                null,
                5,
                List.of(),
                List.of());
    }

    /** Two topics, "Maps" then "Sets", one lesson each. */
    private AdminPathDto path(String status) {
        return authoring.saveOrUpdatePath(
                new AdminPathDto(
                        null,
                        "Interview " + UUID.randomUUID(),
                        "d",
                        "Backend",
                        "learnNow",
                        status,
                        List.of(
                                topic("Maps", 1, "First lesson"),
                                topic("Sets", 2, "Second lesson"))));
    }

    private static AdminPathDto.AdminTopicDto topic(String title, int order, String lesson) {
        return new AdminPathDto.AdminTopicDto(
                null,
                title,
                "t",
                "course",
                "1 hour",
                order,
                "PUBLISHED",
                List.of(
                        new AdminPathDto.AdminSubtopicDto(
                                null,
                                lesson,
                                "### Body",
                                1,
                                "PUBLISHED",
                                "beginner",
                                "concept",
                                List.of(),
                                null,
                                5,
                                List.of(),
                                List.of())));
    }
}
