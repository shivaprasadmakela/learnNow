package com.learnnow.admin.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSubtopicRequest(
    @NotBlank String title,
    String content,
    int orderIndex
) {}
