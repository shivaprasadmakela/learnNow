package com.learnnow.dsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DsaSubmitRequest(
        @NotBlank String language, @NotBlank @Size(max = 60_000) String code) {}
