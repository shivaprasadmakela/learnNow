package com.learnnow.dsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DsaCheckAnswerRequest(@NotBlank @Size(max = 512) String selectedOption) {}
