package com.learnnow.trainer.interview.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.service.ActivityRecordingService;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.privacy.service.ConsentService;
import com.learnnow.trainer.feature.AiFeatureService;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.entity.TopicInterviewAnswer;
import com.learnnow.trainer.interview.repository.TopicInterviewAnswerRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewTurnRepository;
import com.learnnow.trainer.repository.LearnerGoalRepository;
import com.learnnow.trainer.resume.repository.LearnerResumeRepository;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.TrainerQuotaService;
import com.learnnow.trainer.service.TrainerService;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Scoring with the AI client mocked: a question the AI wrote is not in {@code interview_questions},
 * so its prompt, category and model answer must come from the stored plan.
 */
class TopicInterviewScoringTest {

    private final TopicInterviewRepository interviews = mock(TopicInterviewRepository.class);
    private final TopicInterviewTurnRepository turns = mock(TopicInterviewTurnRepository.class);
    private final TopicInterviewAnswerRepository answers =
            mock(TopicInterviewAnswerRepository.class);
    private final InterviewQuestionRepository bank = mock(InterviewQuestionRepository.class);
    private final ActivityRecordingService activity = mock(ActivityRecordingService.class);
    private final AiClient ai = mock(AiClient.class);
    private final TrainerQuotaService quota = mock(TrainerQuotaService.class);
    private final ConsentService consent = mock(ConsentService.class);

    private final TopicInterviewService service =
            new TopicInterviewService(
                    interviews,
                    turns,
                    answers,
                    mock(TopicRepository.class),
                    bank,
                    mock(LearnerResumeRepository.class),
                    mock(LearnerGoalRepository.class),
                    activity,
                    mock(TopicInterviewPlanner.class),
                    ai,
                    mock(TrainerService.class),
                    quota,
                    mock(AiFeatureService.class),
                    consent,
                    Runnable::run,
                    mock(PlatformTransactionManager.class));

    private final UUID id = UUID.randomUUID();
    private final UUID writtenId = UUID.randomUUID();

    private TopicInterview interview(InterviewKind kind) {
        Map<String, Object> question =
                Map.of(
                        "id", writtenId.toString(),
                        "category", "behavioural",
                        "prompt", "Tell me about a hard bug.",
                        "model_answer", "Situation, action, result.");
        return TopicInterview.builder()
                .id(id)
                .userId("u1")
                .kind(kind)
                .status(InterviewStatus.COMPLETED)
                .plan(Map.of("questions", List.of(question)))
                .build();
    }

    private void stubScore(int overall) {
        when(ai.scoreInterview(any()))
                .thenReturn(
                        Map.of(
                                "overall", overall,
                                "habits", Map.of(),
                                "dimensions", Map.of("accuracy", 7, "depth", 6),
                                "strengths", List.of("clear"),
                                "improvements", List.of("add numbers"),
                                "next_step", "Practise STAR answers.",
                                "questions",
                                        List.of(
                                                Map.of(
                                                        "id", writtenId.toString(),
                                                        "score", 6,
                                                        "good", "g",
                                                        "missing", "m",
                                                        "evidence", "e"))));
        when(quota.zone("u1")).thenReturn(ZoneId.of("UTC"));
    }

    @SuppressWarnings("unchecked")
    private TopicInterviewAnswer scoreAndCaptureAnswer(TopicInterview interview) {
        when(interviews.findById(id)).thenReturn(Optional.of(interview));
        when(interviews.findByIdForUpdate(id)).thenReturn(Optional.of(interview));
        when(turns.findByInterviewIdOrderBySeqAsc(id)).thenReturn(List.of());
        service.score(id);
        ArgumentCaptor<List<TopicInterviewAnswer>> captor = ArgumentCaptor.forClass(List.class);
        verify(answers).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        return captor.getValue().get(0);
    }

    @Test
    void writtenQuestionKeepsPlanTextAndHasNoBankLinks() {
        stubScore(60);
        TopicInterview interview = interview(InterviewKind.HR);

        TopicInterviewAnswer a = scoreAndCaptureAnswer(interview);

        assertThat(a.getPlanQuestionId()).isEqualTo(writtenId);
        assertThat(a.getQuestionId()).isNull();
        assertThat(a.getSubtopicId()).isNull();
        assertThat(a.getCategory()).isEqualTo("behavioural");
        assertThat(a.getPrompt()).isEqualTo("Tell me about a hard bug.");
        assertThat(a.getModelAnswer()).isEqualTo("Situation, action, result.");
        assertThat(a.getScore()).isEqualTo(6);
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCORED);
        assertThat(interview.getOverallScore()).isEqualTo(60);
        assertThat(interview.getFeedback())
                .containsEntry("next_step", "Practise STAR answers.")
                .containsKeys("dimensions", "strengths", "improvements");
        assertThat(interview.getPointsAwarded()).isEqualTo(PointsConfig.MOCK_INTERVIEW_COMPLETED);
    }

    @Test
    void strongMockInterviewGetsTheBonus() {
        stubScore(72);
        TopicInterview interview = interview(InterviewKind.FULL);
        scoreAndCaptureAnswer(interview);
        int expected =
                PointsConfig.MOCK_INTERVIEW_COMPLETED + PointsConfig.MOCK_INTERVIEW_STRONG_BONUS;
        assertThat(interview.getPointsAwarded()).isEqualTo(expected);
        verify(activity).recordDailyPoints(eq("u1"), any(ZoneId.class), eq(expected));
    }

    @Test
    void retriesAwardNoPoints() {
        stubScore(90);
        TopicInterview interview = interview(InterviewKind.RETRY);
        scoreAndCaptureAnswer(interview);
        assertThat(interview.getPointsAwarded()).isZero();
        verify(activity, never()).recordDailyPoints(any(), any(ZoneId.class), anyInt());
    }
}
