package com.learnnow.admin.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateTopicRequest(
        @NotBlank String title, String description, String category, String duration) {}
