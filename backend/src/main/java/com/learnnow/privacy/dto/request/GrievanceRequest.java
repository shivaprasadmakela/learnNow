package com.learnnow.privacy.dto.request;

import com.learnnow.privacy.entity.GrievanceCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * A complaint being raised. The reference and status are ours to assign, so neither is accepted.
 */
public record GrievanceRequest(
        @NotNull GrievanceCategory category,
        @NotBlank @Size(max = 255) String subject,
        @NotBlank @Size(max = 5000) String body) {}
