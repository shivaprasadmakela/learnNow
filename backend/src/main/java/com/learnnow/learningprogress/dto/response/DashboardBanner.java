package com.learnnow.learningprogress.dto.response;

import java.util.UUID;

public record DashboardBanner(
        String type, // "FEATURED", "IN_PROGRESS", "REVIEW"
        UUID pathId,
        String pathTitle,
        String pathDescription,
        String pathCategory) {}
