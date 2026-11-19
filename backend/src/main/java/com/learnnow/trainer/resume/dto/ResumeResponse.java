package com.learnnow.trainer.resume.dto;

import com.learnnow.trainer.resume.entity.LearnerResume;
import java.time.Instant;
import java.util.Map;

/**
 * The learner's resume as the trainer read it. {@code profile}, {@code review} and {@code jobMatch}
 * are learnnow-ai's own objects, passed through with their snake_case keys.
 */
public record ResumeResponse(
        String fileName,
        String targetRole,
        Instant analysedAt,
        Map<String, Object> profile,
        Map<String, Object> review,
        String jobDescription,
        Map<String, Object> jobMatch,
        int analysesLeftThisMonth) {

    public static ResumeResponse from(LearnerResume resume, int analysesLeft) {
        return new ResumeResponse(
                resume.getFileName(),
                resume.getTargetRole(),
                resume.getAnalysedAt(),
                resume.getProfile(),
                resume.getReview(),
                resume.getJobDescription(),
                resume.getJobMatch(),
                analysesLeft);
    }
}
