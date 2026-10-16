package com.learnnow.interview.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.dto.request.ImportInterviewBankRequest;
import com.learnnow.interview.dto.request.ImportInterviewBankRequest.Question;
import com.learnnow.interview.dto.response.InterviewImportResultDto;
import com.learnnow.interview.dto.response.InterviewQuestionDto;
import com.learnnow.interview.dto.response.InterviewTopicDto;
import com.learnnow.interview.repository.InterviewQuestionRepository;
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
    void anImportedBankReadsBackAsTreesGroupedByTopicInPathOrder() {
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
                .extracting(InterviewTopicDto::topicTitle)
                .containsExactly("Maps", "Sets");
        InterviewQuestionDto opener = topics.get(0).questions().get(0);
        assertThat(opener.prompt()).isEqualTo("How does a map find a key?");
        assertThat(opener.subtopicTitle()).isEqualTo("First lesson");
        assertThat(opener.depth()).isEqualTo(1);
        assertThat(opener.practice()).isTrue();

        InterviewQuestionDto collide = opener.followUps().get(0);
        assertThat(collide.depth()).isEqualTo(2);
        // Follow-ups share their opener's lesson rather than repeating it.
        assertThat(collide.subtopicId()).isNull();
        assertThat(collide.followUps())
                .extracting(InterviewQuestionDto::prompt, InterviewQuestionDto::depth)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Why switch to a tree?", 3));

        assertThat(topics.get(1).questions())
                .extracting(InterviewQuestionDto::prompt)
                .containsExactly("Asked later?");
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
                                                new Question(
                                                        "Not A Key",
                                                        "First lesson",
                                                        null,
                                                        "Q?",
                                                        " ",
                                                        "deep",
                                                        "signal",
                                                        null))))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("no subtopic titled \"No such lesson\"")
                .hasMessageContaining("appears more than once")
                .hasMessageContaining("follow-ups stop at 3")
                .hasMessageContaining("is not lower-case-hyphenated")
                .hasMessageContaining("all three answers are required");

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
    void aLessonListsOnlyItsOwnOpeners() {
        AdminPathDto path = path("PUBLISHED");
        String p = prefix();
        interview.importBank(
                bank(
                        path,
                        root(p + "one", "First lesson", "One?"),
                        root(p + "two", "Second lesson", "Two?")));
        UUID firstLesson = path.topics().get(0).subtopics().get(0).id();

        assertThat(interview.forSubtopic(firstLesson))
                .extracting(InterviewQuestionDto::prompt)
                .containsExactly("One?");
        assertThat(interview.forSubtopic(UUID.randomUUID())).isEmpty();
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
        return new Question(
                key, subtopic, null, prompt, "short", "deep", "signal", List.of(follow));
    }

    private static Question follow(String key, String prompt, Question... follow) {
        return new Question(key, null, null, prompt, "short", "deep", "signal", List.of(follow));
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
