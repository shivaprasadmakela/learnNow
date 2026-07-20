package com.learnnow.learningprogress.dto.response;

public record DashboardBanner(
    String type, // "FEATURED", "IN_PROGRESS", "REVIEW"
    Long pathId,
    String pathTitle,
    String pathDescription,
    String pathCategory
) {}
