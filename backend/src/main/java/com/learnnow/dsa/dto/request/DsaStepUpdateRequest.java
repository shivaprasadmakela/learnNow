package com.learnnow.dsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Renames a step. The slug is left alone for the same reason a problem's is. */
public record DsaStepUpdateRequest(
        @NotBlank @Size(max = 300) String title, @Size(max = 1000) String description) {}
