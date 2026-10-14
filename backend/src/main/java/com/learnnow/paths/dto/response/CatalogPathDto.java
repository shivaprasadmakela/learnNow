package com.learnnow.paths.dto.response;

import java.util.UUID;

/**
 * A path as the public catalog lists it. {@code topicCount} counts published topics only, and
 * {@code estimatedMinutes} sums the authored estimates of the published lessons in them.
 */
public record CatalogPathDto(
        UUID id,
        String title,
        String description,
        String category,
        String managedBy,
        long topicCount,
        long estimatedMinutes) {}
