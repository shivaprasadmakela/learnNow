package com.learnnow.learningprogress.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record QuizSubmitRequest(
    @NotNull(message = "Question ID is required")
    UUID questionId,

    @NotBlank(message = "Selected option is required")
    String selectedOption
) {}
