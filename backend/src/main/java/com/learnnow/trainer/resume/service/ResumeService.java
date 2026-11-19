package com.learnnow.trainer.resume.service;

import com.learnnow.common.exception.AiRejectedException;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.trainer.feature.AiFeature;
import com.learnnow.trainer.feature.AiFeatureService;
import com.learnnow.trainer.resume.dto.ResumeMatchRequest;
import com.learnnow.trainer.resume.dto.ResumeProfileRequest;
import com.learnnow.trainer.resume.dto.ResumeResponse;
import com.learnnow.trainer.resume.entity.LearnerResume;
import com.learnnow.trainer.resume.repository.LearnerResumeRepository;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.TrainerQuotaService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Resume review: the learner uploads a resume, learnnow-ai reads it into a profile and reviews it,
 * and this keeps what came back. The file itself is sent on and then dropped; only the text read
 * from it is stored, so the learner can be interviewed on it and match it against a job.
 *
 * <p>Analysis takes 10-20 seconds, so no database transaction is held open across it: the AI call
 * runs first, and the result is saved in a short transaction of its own.
 */
@Slf4j
@Service
public class ResumeService {

    static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    static final int MAX_MATCH_TEXT = 24_000;
    static final int MIN_JOB_DESCRIPTION = 80;
    static final int MAX_JOB_DESCRIPTION = 8000;
    private static final Set<String> LEVELS =
            Set.of("student", "fresher", "junior", "mid", "senior");

    private final LearnerResumeRepository repository;
    private final AiClient aiClient;
    private final AiFeatureService featureService;
    private final TrainerQuotaService quotaService;
    private final MessageSource messageSource;
    private final TransactionTemplate tx;

    public ResumeService(
            LearnerResumeRepository repository,
            AiClient aiClient,
            AiFeatureService featureService,
            TrainerQuotaService quotaService,
            MessageSource messageSource,
            PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.aiClient = aiClient;
        this.featureService = featureService;
        this.quotaService = quotaService;
        this.messageSource = messageSource;
        this.tx = new TransactionTemplate(transactionManager);
    }

    public Optional<ResumeResponse> get(String userId) {
        return repository
                .findPresent(userId)
                .map(r -> ResumeResponse.from(r, quotaService.resumeAnalysesLeft(userId)));
    }

    /**
     * Analyses a new resume, replacing any earlier one. The 18-or-older confirmation comes with
     * every upload, so a learner who deleted their resume and comes back confirms again.
     */
    public ResumeResponse upload(
            String userId,
            byte[] file,
            String fileName,
            String contentType,
            String targetRole,
            boolean adultConfirmed) {
        featureService.requireEnabled(AiFeature.RESUME);
        if (!adultConfirmed) {
            throw new ValidationException("resume_adult_confirmation_required");
        }
        if (file == null || file.length == 0) {
            throw rejected("resume_empty");
        }
        if (file.length > MAX_FILE_BYTES) {
            throw rejected("resume_too_large");
        }
        if (quotaService.resumeAnalysesLeft(userId) <= 0) {
            throw new ValidationException("resume_quota_reached");
        }
        String role = blankToNull(targetRole);

        Map<String, Object> result = aiClient.analyseResume(file, fileName, contentType, role);

        String month = TrainerQuotaService.monthKey(quotaService.zone(userId));
        LearnerResume saved =
                tx.execute(
                        status -> {
                            LearnerResume resume =
                                    repository
                                            .findById(userId)
                                            .orElseGet(
                                                    () ->
                                                            LearnerResume.builder()
                                                                    .userId(userId)
                                                                    .analysisMonth(month)
                                                                    .build());
                            if (!month.equals(resume.getAnalysisMonth())) {
                                resume.setAnalysisMonth(month);
                                resume.setAnalysisCount(0);
                            }
                            resume.setAnalysisCount(resume.getAnalysisCount() + 1);
                            resume.setFileName(truncate(fileName, 255));
                            resume.setResumeText(asString(result.get("text")));
                            Map<String, Object> profile = asMap(result.get("profile"));
                            resume.setProfile(profile);
                            resume.setReview(asMap(result.get("review")));
                            resume.setTargetRole(
                                    truncate(role != null ? role : firstTargetRole(profile), 120));
                            // The saved job description still describes the job the learner wants;
                            // the match was against the old resume, so it goes.
                            resume.setJobMatch(null);
                            Instant now = Instant.now();
                            resume.setAnalysedAt(now);
                            resume.setUpdatedAt(now);
                            return repository.save(resume);
                        });
        return ResumeResponse.from(saved, quotaService.resumeAnalysesLeft(userId));
    }

    /** Merges the learner's corrections into the stored profile. */
    public ResumeResponse updateProfile(String userId, ResumeProfileRequest request) {
        featureService.requireEnabled(AiFeature.RESUME);
        if (request.level() != null
                && !request.level().isBlank()
                && !LEVELS.contains(request.level())) {
            throw new ValidationException("resume_level_invalid");
        }
        LearnerResume saved =
                tx.execute(
                        status -> {
                            LearnerResume resume = present(userId);
                            Map<String, Object> profile = new LinkedHashMap<>(resume.getProfile());
                            if (request.headline() != null) {
                                profile.put("headline", request.headline().strip());
                            }
                            if (request.level() != null) {
                                profile.put("level", blankToNull(request.level()));
                            }
                            if (request.yearsExperience() != null) {
                                profile.put("years_experience", request.yearsExperience());
                            }
                            if (request.skills() != null) {
                                profile.put(
                                        "skills",
                                        request.skills().stream()
                                                .filter(s -> s != null && !s.isBlank())
                                                .map(String::strip)
                                                .distinct()
                                                .toList());
                            }
                            if (request.targetRole() != null) {
                                String role = blankToNull(request.targetRole());
                                List<Object> roles = new ArrayList<>();
                                if (profile.get("target_roles") instanceof List<?> old) {
                                    roles.addAll(old);
                                }
                                if (role != null) {
                                    roles.remove(role);
                                    roles.add(0, role);
                                }
                                profile.put("target_roles", roles);
                                resume.setTargetRole(role);
                            }
                            resume.setProfile(profile);
                            resume.setUpdatedAt(Instant.now());
                            return repository.save(resume);
                        });
        return ResumeResponse.from(saved, quotaService.resumeAnalysesLeft(userId));
    }

    /** Compares the resume with a job description and keeps both. */
    public ResumeResponse match(String userId, ResumeMatchRequest request) {
        featureService.requireEnabled(AiFeature.RESUME);
        String jd = request == null ? null : blankToNull(request.jobDescription());
        if (jd == null || jd.length() < MIN_JOB_DESCRIPTION || jd.length() > MAX_JOB_DESCRIPTION) {
            throw new ValidationException("resume_job_description_length");
        }
        LearnerResume resume =
                repository
                        .findPresent(userId)
                        .orElseThrow(() -> new NotFoundException("resume_not_found"));

        Map<String, Object> body = new LinkedHashMap<>();
        // learnnow-ai refuses text over 24,000 characters; a very long resume is cut, not refused.
        body.put("resume_text", truncate(resume.getResumeText(), MAX_MATCH_TEXT));
        body.put("profile", resume.getProfile());
        body.put("job_description", jd);
        Map<String, Object> match = aiClient.matchResume(body);

        LearnerResume saved =
                tx.execute(
                        status -> {
                            LearnerResume current = present(userId);
                            current.setJobDescription(jd);
                            current.setJobMatch(match);
                            current.setUpdatedAt(Instant.now());
                            return repository.save(current);
                        });
        return ResumeResponse.from(saved, quotaService.resumeAnalysesLeft(userId));
    }

    /**
     * Forgets the resume, its job description and match. The row itself stays with only this
     * month's analysis count, so deleting does not hand back the quota.
     */
    public void delete(String userId) {
        tx.executeWithoutResult(
                status ->
                        repository
                                .findById(userId)
                                .ifPresent(
                                        r -> {
                                            r.clearContent();
                                            repository.save(r);
                                        }));
    }

    private LearnerResume present(String userId) {
        return repository
                .findPresent(userId)
                .orElseThrow(() -> new NotFoundException("resume_not_found"));
    }

    private AiRejectedException rejected(String key) {
        return new AiRejectedException(
                "resume_rejected",
                messageSource.getMessage(key, null, key, LocaleContextHolder.getLocale()));
    }

    static String firstTargetRole(Map<String, Object> profile) {
        if (profile != null
                && profile.get("target_roles") instanceof List<?> roles
                && !roles.isEmpty()
                && roles.get(0) instanceof String role
                && !role.isBlank()) {
            return role.strip();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> m ? new LinkedHashMap<>((Map<String, Object>) m) : null;
    }

    private static String asString(Object value) {
        return value instanceof String s ? s : null;
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }
}
