package com.learnnow.admin.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePathRequest(
    @NotBlank String title,
    String description,
    String category,
    String managedBy
) {}
