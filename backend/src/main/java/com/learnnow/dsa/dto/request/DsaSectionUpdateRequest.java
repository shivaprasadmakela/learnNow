package com.learnnow.dsa.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Renames a section.
 *
 * <p>{@code title} is nullable on purpose: a step whose problems all sit in one untitled section
 * renders flat, so clearing the title is a meaningful edit rather than a missing value.
 */
public record DsaSectionUpdateRequest(
        @Size(max = 255) String title, @Size(max = 1000) String description) {}
