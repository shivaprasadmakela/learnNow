package com.learnnow.trainer.resume;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnnow.common.exception.AiRejectedException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.trainer.feature.AiFeatureService;
import com.learnnow.trainer.resume.dto.ResumeProfileRequest;
import com.learnnow.trainer.resume.dto.ResumeResponse;
import com.learnnow.trainer.resume.entity.LearnerResume;
import com.learnnow.trainer.resume.repository.LearnerResumeRepository;
import com.learnnow.trainer.resume.service.ResumeService;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.TrainerQuotaService;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.MessageSource;
import org.springframework.transaction.PlatformTransactionManager;

class ResumeServiceTest {

    private final LearnerResumeRepository repository = mock(LearnerResumeRepository.class);
    private final AiClient ai = mock(AiClient.class);
    private final TrainerQuotaService quota = mock(TrainerQuotaService.class);
    private final ResumeService service =
            new ResumeService(
                    repository,
                    ai,
                    mock(AiFeatureService.class),
                    quota,
                    mock(MessageSource.class),
                    mock(PlatformTransactionManager.class));

    private void quotaLeft(int left) {
        when(quota.resumeAnalysesLeft("u1")).thenReturn(left);
        when(quota.zone("u1")).thenReturn(ZoneId.of("UTC"));
    }

    private static Map<String, Object> analysis() {
        return Map.of(
                "text", "resume text",
                "profile",
                        Map.of(
                                "headline",
                                "Java dev",
                                "level",
                                "fresher",
                                "target_roles",
                                List.of("Backend engineer"),
                                "skills",
                                List.of("Java")),
                "review", Map.of("overall", 62));
    }

    @Test
    void uploadStoresTheAnalysisAndCountsIt() {
        quotaLeft(3);
        when(repository.findById("u1")).thenReturn(Optional.empty());
        when(repository.save(any(LearnerResume.class))).thenAnswer(i -> i.getArgument(0));
        when(ai.analyseResume(any(), eq("cv.pdf"), anyString(), eq(null))).thenReturn(analysis());

        ResumeResponse out =
                service.upload("u1", new byte[] {1, 2, 3}, "cv.pdf", "application/pdf", null, true);

        ArgumentCaptor<LearnerResume> saved = ArgumentCaptor.forClass(LearnerResume.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getResumeText()).isEqualTo("resume text");
        assertThat(saved.getValue().getAnalysisCount()).isEqualTo(1);
        assertThat(saved.getValue().getTargetRole()).isEqualTo("Backend engineer");
        assertThat(out.review()).containsEntry("overall", 62);
        assertThat(out.fileName()).isEqualTo("cv.pdf");
    }

    @Test
    void adultConfirmationIsRequired() {
        assertThatThrownBy(
                        () ->
                                service.upload(
                                        "u1",
                                        new byte[] {1},
                                        "cv.pdf",
                                        "application/pdf",
                                        null,
                                        false))
                .isInstanceOf(ValidationException.class)
                .hasMessage("resume_adult_confirmation_required");
        verify(ai, never()).analyseResume(any(), any(), any(), any());
    }

    @Test
    void quotaReachedStopsBeforeTheAiCall() {
        quotaLeft(0);
        assertThatThrownBy(
                        () ->
                                service.upload(
                                        "u1",
                                        new byte[] {1},
                                        "cv.pdf",
                                        "application/pdf",
                                        null,
                                        true))
                .isInstanceOf(ValidationException.class)
                .hasMessage("resume_quota_reached");
        verify(ai, never()).analyseResume(any(), any(), any(), any());
    }

    @Test
    void rejectionFromTheAiReachesTheLearnerAndSavesNothing() {
        quotaLeft(3);
        when(ai.analyseResume(any(), any(), any(), any()))
                .thenThrow(new AiRejectedException("resume_rejected", "No text could be read."));

        assertThatThrownBy(
                        () ->
                                service.upload(
                                        "u1",
                                        new byte[] {1},
                                        "cv.pdf",
                                        "application/pdf",
                                        null,
                                        true))
                .isInstanceOf(AiRejectedException.class)
                .hasMessage("No text could be read.");
        verify(repository, never()).save(any());
    }

    @Test
    void profileCorrectionsAreMergedIntoTheStoredProfile() {
        quotaLeft(3);
        Map<String, Object> stored = new LinkedHashMap<>();
        stored.put("headline", "Java dev");
        stored.put("skills", List.of("Old"));
        stored.put("projects", List.of(Map.of("name", "Shop")));
        LearnerResume resume =
                LearnerResume.builder()
                        .userId("u1")
                        .profile(stored)
                        .analysisMonth("2026-11")
                        .build();
        when(repository.findPresent("u1")).thenReturn(Optional.of(resume));
        when(repository.save(any(LearnerResume.class))).thenAnswer(i -> i.getArgument(0));

        service.updateProfile(
                "u1",
                new ResumeProfileRequest(
                        "Spring dev",
                        "junior",
                        1.5,
                        "Platform engineer",
                        List.of("Java", " SQL ", "Java")));

        assertThat(resume.getProfile())
                .containsEntry("headline", "Spring dev")
                .containsEntry("level", "junior")
                .containsEntry("years_experience", 1.5)
                .containsEntry("skills", List.of("Java", "SQL"))
                .containsKey("projects");
        assertThat((List<?>) resume.getProfile().get("target_roles"))
                .first()
                .isEqualTo("Platform engineer");
        assertThat(resume.getTargetRole()).isEqualTo("Platform engineer");
    }
}
