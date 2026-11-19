package com.learnnow.trainer.interview.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.interview.repository.InterviewQuestionRepository.SubtopicRow;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.user.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TopicInterviewPlannerTest {

    private final InterviewQuestionRepository questions = mock(InterviewQuestionRepository.class);
    private final TopicInterviewRepository interviews = mock(TopicInterviewRepository.class);
    private final TopicInterviewPlanner planner =
            new TopicInterviewPlanner(
                    mock(TopicRepository.class),
                    questions,
                    interviews,
                    mock(UserRepository.class),
                    mock(UserTopicProgressRepository.class),
                    "http://localhost:8080/");

    private static Map<String, Object> written(String id, String prompt) {
        return Map.of(
                "id",
                id,
                "category",
                "behavioural",
                "prompt",
                prompt,
                "key_points",
                List.of("a"),
                "model_answer",
                "an answer",
                "follow_ups",
                List.of(Map.of("id", UUID.randomUUID().toString(), "prompt", "why?")));
    }

    /** A topic whose bank has exactly one published opener. */
    private InterviewQuestion bankTopicWithOneQuestion(UUID topicId) {
        UUID subtopicId = UUID.randomUUID();
        SubtopicRow row = mock(SubtopicRow.class);
        when(row.getId()).thenReturn(subtopicId);
        when(questions.findPublishedSubtopicsInTopic(topicId)).thenReturn(List.of(row));
        InterviewQuestion q =
                InterviewQuestion.builder()
                        .id(UUID.randomUUID())
                        .subtopicId(subtopicId)
                        .prompt("What is a bean?")
                        .answerSimple("A bean is an object Spring manages. It has a scope.")
                        .answerShort("short")
                        .status(ContentStatus.PUBLISHED)
                        .build();
        when(questions.findBySubtopicIdInAndStatus(anyCollection(), any())).thenReturn(List.of(q));
        return q;
    }

    @Test
    @SuppressWarnings("unchecked")
    void mockPlanKeepsWrittenQuestionsAndFillsBankSlots() {
        UUID topicId = UUID.randomUUID();
        InterviewQuestion bank = bankTopicWithOneQuestion(topicId);
        UUID writtenId = UUID.randomUUID();
        List<Object> items =
                List.of(
                        written(writtenId.toString(), "Tell me about a conflict."),
                        Map.of("category", "technical", "bank_topic_id", topicId.toString()),
                        // a topic the backend never offered: dropped
                        Map.of(
                                "category",
                                "technical",
                                "bank_topic_id",
                                UUID.randomUUID().toString()));
        UUID interviewId = UUID.randomUUID();

        Map<String, Object> plan =
                planner.mockPlan(
                        "u1",
                        interviewId,
                        InterviewKind.FULL,
                        "Java developer",
                        "Headline: x",
                        items,
                        Set.of(topicId));

        assertThat(plan.get("kind")).isEqualTo("full");
        assertThat(plan.get("topic_title")).isEqualTo("Java developer");
        assertThat(plan.get("max_seconds")).isEqualTo(1500);
        assertThat(plan.get("candidate_brief")).isEqualTo("Headline: x");
        assertThat((String) plan.get("callback_url")).contains(interviewId.toString());
        List<Map<String, Object>> qs = (List<Map<String, Object>>) plan.get("questions");
        assertThat(qs).hasSize(2);
        assertThat(qs.get(0).get("id")).isEqualTo(writtenId.toString());
        assertThat(qs.get(0).get("category")).isEqualTo("behavioural");
        assertThat((List<?>) qs.get(0).get("follow_ups")).hasSize(1);
        assertThat(qs.get(1).get("id")).isEqualTo(bank.getId().toString());
        assertThat(qs.get(1).get("category")).isEqualTo("technical");
        assertThat(qs.get(1).get("topic_id")).isEqualTo(topicId.toString());
        assertThat(qs.get(1).get("model_answer"))
                .isEqualTo("A bean is an object Spring manages. It has a scope.");
    }

    @Test
    void fewerThanTwoQuestionsFails() {
        List<Object> items = List.of(written(UUID.randomUUID().toString(), "Only one"));
        assertThatThrownBy(
                        () ->
                                planner.mockPlan(
                                        "u1",
                                        UUID.randomUUID(),
                                        InterviewKind.HR,
                                        "Role",
                                        null,
                                        items,
                                        Set.of()))
                .isInstanceOf(ValidationException.class)
                .hasMessage("mock_interview_no_questions");
    }

    @Test
    void assembleDropsEmptyBankSlotsReplacesBadIdsAndCapsAtEight() {
        List<Object> items = new java.util.ArrayList<>();
        items.add(Map.of("category", "technical", "bank_topic_id", UUID.randomUUID().toString()));
        items.add(Map.of("category", "hr", "prompt", "  "));
        items.add(written("not-a-uuid", "Question with a bad id"));
        for (int i = 0; i < 12; i++) {
            items.add(written(UUID.randomUUID().toString(), "Q" + i));
        }
        List<Map<String, Object>> out =
                TopicInterviewPlanner.assembleQuestions(items, id -> java.util.Optional.empty());
        assertThat(out).hasSize(TopicInterviewPlanner.MAX_QUESTIONS);
        assertThat(out.get(0).get("prompt")).isEqualTo("Question with a bad id");
        assertThat(TopicInterviewPlanner.parseUuid(out.get(0).get("id"))).isPresent();
    }

    @Test
    void candidateBriefHasNoContactDetailsAndIsCapped() {
        Map<String, Object> profile =
                Map.of(
                        "headline",
                        "Backend dev, reach me at jo@example.com or +91 98765 43210",
                        "level",
                        "junior",
                        "years_experience",
                        2,
                        "skills",
                        List.of("Java", "Spring", "SQL"),
                        "experience",
                        List.of(Map.of("title", "Developer", "company", "Acme")),
                        "projects",
                        List.of(Map.of("name", "Shop API")));
        String brief = TopicInterviewPlanner.candidateBrief(profile);
        assertThat(brief)
                .contains("Java, Spring, SQL", "Developer at Acme", "Shop API", "junior")
                .doesNotContain("jo@example.com")
                .doesNotContain("98765");
        assertThat(brief.length()).isLessThanOrEqualTo(TopicInterviewPlanner.MAX_BRIEF_CHARS);
        assertThat(TopicInterviewPlanner.candidateBrief(Map.of())).isNull();
        assertThat(TopicInterviewPlanner.candidateBrief(null)).isNull();
    }
}
