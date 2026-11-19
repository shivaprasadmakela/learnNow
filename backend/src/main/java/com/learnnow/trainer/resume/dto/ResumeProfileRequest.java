package com.learnnow.trainer.resume.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * The learner correcting what was read from their resume. A null field is left as it was; an empty
 * string clears it.
 */
public record ResumeProfileRequest(
        @Size(max = 200) String headline,
        String level,
        @Min(0) @Max(60) Double yearsExperience,
        @Size(max = 120) String targetRole,
        @Size(max = 60) List<@Size(max = 80) String> skills) {}
