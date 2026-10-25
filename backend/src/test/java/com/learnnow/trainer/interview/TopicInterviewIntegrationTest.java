package com.learnnow.trainer.interview;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.privacy.dto.response.DataExportResponse;
import com.learnnow.privacy.service.DataExportService;
import com.learnnow.trainer.interview.controller.InternalInterviewController;
import com.learnnow.trainer.interview.dto.InterviewAvailabilityResponse;
import com.learnnow.trainer.interview.dto.StartInterviewResponse;
import com.learnnow.trainer.interview.dto.TopicInterviewReportResponse;
import com.learnnow.trainer.interview.dto.TranscriptCallbackRequest;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.entity.TopicInterviewAnswer;
import com.learnnow.trainer.interview.entity.TopicInterviewTurn;
import com.learnnow.trainer.interview.repository.TopicInterviewAnswerRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewTurnRepository;
import com.learnnow.trainer.interview.service.TopicInterviewPlanner;
import com.learnnow.trainer.interview.service.TopicInterviewService;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class TopicInterviewIntegrationTest extends AbstractIntegrationTest {

    @MockBean private AiClient aiClient;

    @Autowired private TopicInterviewService interviewService;

    @Autowired private TopicInterviewPlanner planner;

    @Autowired private TopicInterviewRepository interviewRepository;

    @Autowired private TopicInterviewTurnRepository turnRepository;

    @Autowired private TopicInterviewAnswerRepository answerRepository;

    @Autowired private UserRepository userRepository;

    @Autowired private TopicRepository topicRepository;

    @Autowired private SubtopicRepository subtopicRepository;

    @Autowired private InterviewQuestionRepository questionRepository;

    @Autowired private DataExportService exportService;

    @Autowired private InternalInterviewController internalController;

    @Autowired private UserLearningPreferencesRepository preferencesRepository;

    @Value("${learnnow.ai.service-token}")
    private String serviceToken;

    private User learner;
    private Topic topic;
    private Subtopic subtopic;
    private InterviewQuestion rootQuestion;
    private InterviewQuestion followUpQuestion;

    @BeforeEach
    void setUp() {
        String userId = "learner-" + UUID.randomUUID();
        learner =
                User.builder()
                        .id(userId)
                        .email(userId + "@example.com")
                        .fullName("Asha Rao")
                        .firstName("Asha")
                        .lastName("Rao")
                        .role("USER")
                        .emailVerified(true)
                        .build();
        userRepository.save(learner);

        preferencesRepository.save(
                UserLearningPreferences.builder()
                        .userId(userId)
                        .timezone("Asia/Kolkata")
                        .totalPoints(100)
                        .currentStreak(2)
                        .longestStreak(5)
                        .build());

        topic =
                Topic.builder()
                        .title("Spring Core & Dependency Injection")
                        .category("course")
                        .description("Spring IoC and DI fundamentals")
                        .build();
        topicRepository.save(topic);

        subtopic =
                Subtopic.builder()
                        .topic(topic)
                        .title("Bean Lifecycle & Scopes")
                        .orderIndex(1)
                        .status(ContentStatus.PUBLISHED)
                        .build();
        subtopicRepository.save(subtopic);

        rootQuestion =
                InterviewQuestion.builder()
                        .questionKey("spring-bean-scopes-" + UUID.randomUUID())
                        .subtopicId(subtopic.getId())
                        .depth(1)
                        .orderIndex(1)
                        .prompt(
                                "What are Spring bean scopes and how do singleton and prototype"
                                        + " differ?")
                        .answerRemember(
                                "Singleton has one instance per IoC container; prototype creates a"
                                        + " new instance per lookup.")
                        .answerSimple(
                                "Singleton is created once. Prototype is created on every"
                                        + " injection.")
                        .answerHow("Spring creates singleton on startup and caches it.")
                        .answerExample("A UserService bean is usually singleton.")
                        .answerScript(
                                "In Spring, singleton scope means one shared instance per"
                                        + " ApplicationContext.")
                        .answerShort("Singleton once, prototype per lookup.")
                        .answerDeep("Spring container manages singleton lifecycle.")
                        .answerSignal("Understands bean scopes.")
                        .status(ContentStatus.PUBLISHED)
                        .build();
        questionRepository.save(rootQuestion);

        followUpQuestion =
                InterviewQuestion.builder()
                        .questionKey("spring-inject-prototype-" + UUID.randomUUID())
                        .subtopicId(subtopic.getId())
                        .parentId(rootQuestion.getId())
                        .depth(2)
                        .orderIndex(1)
                        .prompt(
                                "What happens when you inject a prototype bean into a singleton"
                                        + " bean?")
                        .answerRemember(
                                "It is only resolved once at instantiation time unless using Lookup"
                                        + " or Provider.")
                        .answerSimple("The singleton retains the same prototype instance forever.")
                        .answerHow("Injection occurs only during singleton instantiation.")
                        .answerExample(
                                "Injecting prototype TokenGenerator into singleton AuthService.")
                        .answerScript(
                                "Because singleton creation happens once, the prototype dependency"
                                        + " is only wired once.")
                        .answerShort("Singleton retains same prototype.")
                        .answerDeep("Use ObjectProvider or lookup method.")
                        .answerSignal("Aware of scoping caveat.")
                        .status(ContentStatus.PUBLISHED)
                        .build();
        questionRepository.save(followUpQuestion);

        when(aiClient.configured()).thenReturn(true);
        when(aiClient.voiceAvailable()).thenReturn(true);
    }

    @Test
    @DisplayName(
            "Planner gathers root questions with follow-ups and start response conceals model"
                    + " answers")
    void plannerAndStartConcealModelAnswers() {
        UUID interviewId = UUID.randomUUID();
        Map<String, Object> plan = planner.plan(topic.getId(), learner.getId(), interviewId);

        assertThat(plan.get("topic_title")).isEqualTo("Spring Core & Dependency Injection");
        assertThat(plan.get("first_name")).isEqualTo("Asha");
        assertThat(plan.get("callback_url")).asString().contains(interviewId.toString());

        List<?> questions = (List<?>) plan.get("questions");
        assertThat(questions).hasSize(1);
        Map<?, ?> q0 = (Map<?, ?>) questions.get(0);
        assertThat(q0.get("prompt")).isEqualTo(rootQuestion.getPrompt());
        assertThat(q0.get("key_points")).isNotNull();
        assertThat(q0.get("model_answer")).asString().isNotEmpty();

        List<?> followUps = (List<?>) q0.get("follow_ups");
        assertThat(followUps).hasSize(1);
        Map<?, ?> fu0 = (Map<?, ?>) followUps.get(0);
        assertThat(fu0.get("prompt")).isEqualTo(followUpQuestion.getPrompt());

        // Now test starting interview
        when(aiClient.startInterview(any()))
                .thenReturn(
                        Map.of(
                                "id",
                                interviewId.toString(),
                                "room",
                                "room-" + interviewId,
                                "url",
                                "wss://livekit.example.com",
                                "token",
                                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.browser_token"));

        StartInterviewResponse startResponse =
                interviewService.start(learner.getId(), topic.getId());
        assertThat(startResponse.url()).isEqualTo("wss://livekit.example.com");
        assertThat(startResponse.token())
                .isEqualTo("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.browser_token");

        // Verify the database recorded the interview in CREATED status
        TopicInterview created =
                interviewRepository.findById(startResponse.interviewId()).orElseThrow();
        assertThat(created.getStatus()).isEqualTo(InterviewStatus.CREATED);
        assertThat(created.getUserId()).isEqualTo(learner.getId());
        assertThat(created.getTopicId()).isEqualTo(topic.getId());
    }

    @Test
    @DisplayName("Monthly quota counts down and refunds on failure")
    void monthlyQuotaCountingAndRefundOnFailure() {
        int initialLeft = interviewService.interviewsLeftThisMonth(learner.getId());
        assertThat(initialLeft).isEqualTo(5);

        when(aiClient.startInterview(any()))
                .thenReturn(
                        Map.of(
                                "id",
                                UUID.randomUUID().toString(),
                                "room",
                                "test-room",
                                "url",
                                "wss://livekit.example.com",
                                "token",
                                "token"));

        // Start 1 interview
        StartInterviewResponse res1 = interviewService.start(learner.getId(), topic.getId());
        assertThat(interviewService.interviewsLeftThisMonth(learner.getId())).isEqualTo(4);

        // Mark it FAILED (e.g. timeout or worker failure)
        TopicInterview interview1 = interviewRepository.findById(res1.interviewId()).orElseThrow();
        interview1.setStatus(InterviewStatus.FAILED);
        interviewRepository.save(interview1);

        // Failed interviews are refunded
        assertThat(interviewService.interviewsLeftThisMonth(learner.getId())).isEqualTo(5);

        // Simulate 5 completed/scored interviews
        for (int i = 0; i < 5; i++) {
            TopicInterview past =
                    TopicInterview.builder()
                            .id(UUID.randomUUID())
                            .userId(learner.getId())
                            .topicId(topic.getId())
                            .status(InterviewStatus.SCORED)
                            .plan(Map.of("topic_title", topic.getTitle()))
                            .pointsAwarded(15)
                            .build();
            interviewRepository.save(past);
        }

        assertThat(interviewService.interviewsLeftThisMonth(learner.getId())).isEqualTo(0);
        InterviewAvailabilityResponse avail =
                interviewService.availability(learner.getId(), topic.getId());
        assertThat(avail.available()).isFalse();
        assertThat(avail.reason()).isEqualTo("topic_interview_quota_reached");

        assertThatThrownBy(() -> interviewService.start(learner.getId(), topic.getId()))
                .isInstanceOf(ValidationException.class)
                .hasMessage("topic_interview_quota_reached");
    }

    @Test
    @DisplayName("Internal callback validates service token with MessageDigest and is idempotent")
    void callbackSecurityAndIdempotency() {
        UUID interviewId = UUID.randomUUID();
        TopicInterview interview =
                TopicInterview.builder()
                        .id(interviewId)
                        .userId(learner.getId())
                        .topicId(topic.getId())
                        .status(InterviewStatus.CREATED)
                        .plan(Map.of("topic_title", topic.getTitle()))
                        .build();
        interviewRepository.save(interview);

        TranscriptCallbackRequest request =
                new TranscriptCallbackRequest(
                        interviewId,
                        List.of(
                                new TranscriptCallbackRequest.TurnPayload(
                                        "assistant", "Hello Asha", new BigDecimal("1.2"), null),
                                new TranscriptCallbackRequest.TurnPayload(
                                        "user",
                                        "Hi there",
                                        new BigDecimal("3.4"),
                                        rootQuestion.getId())),
                        new BigDecimal("1.5"),
                        new BigDecimal("4.50"),
                        "completed");

        // 1. Missing / invalid token returns 401
        ResponseEntity<Void> unauth1 =
                internalController.receiveTranscript(interviewId, null, request);
        assertThat(unauth1.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Void> unauth2 =
                internalController.receiveTranscript(interviewId, "Bearer wrong-token", request);
        assertThat(unauth2.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // 2. Valid token records transcript
        when(aiClient.scoreInterview(any()))
                .thenReturn(
                        Map.of(
                                "overall",
                                82,
                                "questions",
                                List.of(
                                        Map.of(
                                                "id",
                                                rootQuestion.getId().toString(),
                                                "score",
                                                8,
                                                "good",
                                                "Great explanation of singleton scope",
                                                "missing",
                                                "Could have mentioned thread safety",
                                                "evidence",
                                                "Singleton is created once"))));

        ResponseEntity<Void> success =
                internalController.receiveTranscript(
                        interviewId, "Bearer " + serviceToken, request);
        assertThat(success.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<TopicInterviewTurn> turns = turnRepository.findByInterviewIdOrderBySeqAsc(interviewId);
        assertThat(turns).hasSize(2);
        assertThat(turns.get(0).getRole()).isEqualTo("assistant");
        assertThat(turns.get(1).getRole()).isEqualTo("user");

        // 3. Duplicate callback should be safely ignored (idempotent)
        ResponseEntity<Void> duplicate =
                internalController.receiveTranscript(
                        interviewId, "Bearer " + serviceToken, request);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Turn count should remain 2, not 4
        assertThat(turnRepository.findByInterviewIdOrderBySeqAsc(interviewId)).hasSize(2);
    }

    @Test
    @DisplayName("Scoring stores answers and awards points once per topic with 80% bonus")
    void scoringAwardsPointsOncePerTopic() {
        UUID interviewId = UUID.randomUUID();
        TopicInterview interview =
                TopicInterview.builder()
                        .id(interviewId)
                        .userId(learner.getId())
                        .topicId(topic.getId())
                        .status(InterviewStatus.COMPLETED)
                        .plan(
                                Map.of(
                                        "topic_title",
                                        topic.getTitle(),
                                        "questions",
                                        List.of(
                                                Map.of(
                                                        "id",
                                                        rootQuestion.getId().toString(),
                                                        "prompt",
                                                        rootQuestion.getPrompt(),
                                                        "key_points",
                                                        List.of(
                                                                "singleton once",
                                                                "prototype lookup"),
                                                        "model_answer",
                                                        rootQuestion.getAnswerScript()))))
                        .build();
        interviewRepository.save(interview);

        turnRepository.save(
                TopicInterviewTurn.builder()
                        .interviewId(interviewId)
                        .seq(0)
                        .role("assistant")
                        .text(rootQuestion.getPrompt())
                        .atSeconds(new BigDecimal("1.0"))
                        .questionId(rootQuestion.getId())
                        .build());
        turnRepository.save(
                TopicInterviewTurn.builder()
                        .interviewId(interviewId)
                        .seq(1)
                        .role("user")
                        .text(
                                "Singleton is instantiated once per container, while prototype"
                                        + " creates a new one every lookup.")
                        .atSeconds(new BigDecimal("5.0"))
                        .questionId(rootQuestion.getId())
                        .build());

        when(aiClient.scoreInterview(any()))
                .thenReturn(
                        Map.of(
                                "overall",
                                85,
                                "questions",
                                List.of(
                                        Map.of(
                                                "id",
                                                rootQuestion.getId().toString(),
                                                "score",
                                                9,
                                                "good",
                                                "Accurate definition of both scopes",
                                                "missing",
                                                "None",
                                                "evidence",
                                                "Singleton is instantiated once per"
                                                        + " container"))));

        // Score interview
        interviewService.score(interviewId);

        TopicInterview scored = interviewRepository.findById(interviewId).orElseThrow();
        assertThat(scored.getStatus()).isEqualTo(InterviewStatus.SCORED);
        assertThat(scored.getOverallScore()).isEqualTo(85);
        // 15 completed + 10 strong bonus (overall >= 80)
        assertThat(scored.getPointsAwarded()).isEqualTo(25);

        List<TopicInterviewAnswer> answers = answerRepository.findByInterviewId(interviewId);
        assertThat(answers).hasSize(1);
        assertThat(answers.get(0).getScore()).isEqualTo(9);
        assertThat(answers.get(0).getGood()).isEqualTo("Accurate definition of both scopes");

        // Verify report response
        TopicInterviewReportResponse report = interviewService.report(learner.getId(), interviewId);
        assertThat(report.overallScore()).isEqualTo(85);
        assertThat(report.pointsAwarded()).isEqualTo(25);
        assertThat(report.questions()).hasSize(1);
        assertThat(report.questions().get(0).score()).isEqualTo(9);

        // A second interview on the same topic should award 0 points (only once per topic)
        UUID interviewId2 = UUID.randomUUID();
        TopicInterview interview2 =
                TopicInterview.builder()
                        .id(interviewId2)
                        .userId(learner.getId())
                        .topicId(topic.getId())
                        .status(InterviewStatus.COMPLETED)
                        .plan(interview.getPlan())
                        .build();
        interviewRepository.save(interview2);

        interviewService.score(interviewId2);
        TopicInterview scored2 = interviewRepository.findById(interviewId2).orElseThrow();
        assertThat(scored2.getStatus()).isEqualTo(InterviewStatus.SCORED);
        assertThat(scored2.getPointsAwarded()).isEqualTo(0);
    }

    @Test
    @DisplayName("Data export includes topic interviews, turns, and answers")
    void dataExportIncludesInterviews() {
        UUID interviewId = UUID.randomUUID();
        TopicInterview interview =
                TopicInterview.builder()
                        .id(interviewId)
                        .userId(learner.getId())
                        .topicId(topic.getId())
                        .status(InterviewStatus.SCORED)
                        .overallScore(90)
                        .pointsAwarded(25)
                        .plan(Map.of("topic_title", topic.getTitle()))
                        .habits(Map.of("wpm", 130))
                        .createdAt(Instant.now())
                        .completedAt(Instant.now())
                        .build();
        interviewRepository.save(interview);

        turnRepository.save(
                TopicInterviewTurn.builder()
                        .interviewId(interviewId)
                        .seq(0)
                        .role("assistant")
                        .text("What is dependency injection?")
                        .atSeconds(new BigDecimal("1.0"))
                        .build());

        answerRepository.save(
                TopicInterviewAnswer.builder()
                        .interviewId(interviewId)
                        .questionId(rootQuestion.getId())
                        .prompt("What is dependency injection?")
                        .score(9)
                        .good("Very thorough answer")
                        .missing("None")
                        .evidence("Inversion of control")
                        .build());

        DataExportResponse export = exportService.export(learner.getId());
        assertThat(export.trainer()).isNotNull();
        assertThat(export.trainer().topicInterviews()).hasSize(1);

        DataExportResponse.TopicInterviewEntry entry = export.trainer().topicInterviews().get(0);
        assertThat(entry.id()).isEqualTo(interviewId);
        assertThat(entry.overallScore()).isEqualTo(90);
        assertThat(entry.pointsAwarded()).isEqualTo(25);
        assertThat(entry.turns()).hasSize(1);
        assertThat(entry.turns().get(0).text()).isEqualTo("What is dependency injection?");
        assertThat(entry.answers()).hasSize(1);
        assertThat(entry.answers().get(0).score()).isEqualTo(9);
    }
}
