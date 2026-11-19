package com.learnnow.trainer.resume.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * What was read from a learner's resume, and the AI's review of it. One per learner: a new upload
 * replaces the old one. The file itself is never stored, only the text learnnow-ai read from it.
 *
 * <p>Deleting the resume clears every column except the monthly analysis count, so a learner cannot
 * reset the quota by deleting and uploading again. {@link #present()} is what "has a resume" means
 * everywhere else.
 */
@Entity
@Table(name = "learner_resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerResume {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "resume_text", columnDefinition = "TEXT")
    private String resumeText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> profile;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> review;

    @Column(name = "target_role", length = 120)
    private String targetRole;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "job_match", columnDefinition = "jsonb")
    private Map<String, Object> jobMatch;

    /** "YYYY-MM" in the learner's time zone; the month analysisCount belongs to. */
    @Column(name = "analysis_month", nullable = false, length = 7)
    private String analysisMonth;

    @Column(name = "analysis_count", nullable = false)
    private int analysisCount;

    @Column(name = "analysed_at")
    private Instant analysedAt;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public boolean present() {
        return profile != null;
    }

    /** Forgets the resume but keeps the month's analysis count. */
    public void clearContent() {
        fileName = null;
        resumeText = null;
        profile = null;
        review = null;
        targetRole = null;
        jobDescription = null;
        jobMatch = null;
        analysedAt = null;
        updatedAt = Instant.now();
    }
}
