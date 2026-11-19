package com.learnnow.trainer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.plan.repository.TrainerWeeklyPlanRepository;
import com.learnnow.trainer.resume.entity.LearnerResume;
import com.learnnow.trainer.resume.repository.LearnerResumeRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class TrainerQuotaServiceTest {

    private final TopicInterviewRepository interviews = mock(TopicInterviewRepository.class);
    private final LearnerResumeRepository resumes = mock(LearnerResumeRepository.class);
    private final TrainerWeeklyPlanRepository plans = mock(TrainerWeeklyPlanRepository.class);
    private final UserLearningPreferencesRepository prefs =
            mock(UserLearningPreferencesRepository.class);
    private final TrainerQuotaService service =
            new TrainerQuotaService(interviews, resumes, plans, prefs, 5, 2, 3, 5, 3);

    @SuppressWarnings("unchecked")
    private Collection<InterviewKind> kindsCounted(
            int used, java.util.function.Supplier<Integer> call) {
        when(interviews.countByUserIdAndKindInAndCreatedAtAfterAndStatusNot(
                        eq("u"), anyCollection(), any(Instant.class), eq(InterviewStatus.FAILED)))
                .thenReturn((long) used);
        call.get();
        ArgumentCaptor<Collection<InterviewKind>> kinds = ArgumentCaptor.forClass(Collection.class);
        verify(interviews)
                .countByUserIdAndKindInAndCreatedAtAfterAndStatusNot(
                        eq("u"), kinds.capture(), any(Instant.class), eq(InterviewStatus.FAILED));
        return kinds.getValue();
    }

    @Test
    void topicQuotaCountsOnlyTopicInterviews() {
        Collection<InterviewKind> kinds = kindsCounted(2, () -> service.topicInterviewsLeft("u"));
        assertThat(kinds).containsExactly(InterviewKind.TOPIC);
        assertThat(service.topicInterviewsLeft("u")).isEqualTo(3);
    }

    @Test
    void mockQuotaCountsMockKindsButNotTopicOrRetry() {
        Collection<InterviewKind> kinds = kindsCounted(1, () -> service.mockInterviewsLeft("u"));
        assertThat(kinds)
                .containsExactlyInAnyOrder(
                        InterviewKind.RESUME,
                        InterviewKind.HR,
                        InterviewKind.BEHAVIOURAL,
                        InterviewKind.PROJECT,
                        InterviewKind.FULL);
        assertThat(service.mockInterviewsLeft("u")).isEqualTo(1);
    }

    @Test
    void retryQuotaCountsOnlyRetriesAndNeverGoesNegative() {
        Collection<InterviewKind> kinds = kindsCounted(9, () -> service.retriesLeftToday("u"));
        assertThat(kinds).containsExactly(InterviewKind.RETRY);
        assertThat(service.retriesLeftToday("u")).isZero();
    }

    @Test
    void resumeAnalysesCountOnlyThisMonth() {
        String month = TrainerQuotaService.monthKey(ZoneId.of("UTC"));
        when(resumes.findById("u"))
                .thenReturn(
                        Optional.of(
                                LearnerResume.builder()
                                        .userId("u")
                                        .analysisMonth(month)
                                        .analysisCount(2)
                                        .build()));
        assertThat(service.resumeAnalysesLeft("u")).isEqualTo(1);

        when(resumes.findById("u"))
                .thenReturn(
                        Optional.of(
                                LearnerResume.builder()
                                        .userId("u")
                                        .analysisMonth("2000-01")
                                        .analysisCount(3)
                                        .build()));
        assertThat(service.resumeAnalysesLeft("u")).isEqualTo(3);
    }

    @Test
    void weekStartIsMonday() {
        assertThat(TrainerQuotaService.weekStart(LocalDate.of(2026, 11, 15)))
                .isEqualTo(LocalDate.of(2026, 11, 9));
        assertThat(TrainerQuotaService.weekStart(LocalDate.of(2026, 11, 9)))
                .isEqualTo(LocalDate.of(2026, 11, 9));
        assertThat(List.of(service.limits().topicInterviews(), service.limits().mockInterviews()))
                .containsExactly(5, 2);
    }
}
