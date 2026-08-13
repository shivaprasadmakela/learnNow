package com.learnnow.admin.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateSubtopicRequest(
    @NotBlank String title,
    String content,
    int orderIndex
) {}
