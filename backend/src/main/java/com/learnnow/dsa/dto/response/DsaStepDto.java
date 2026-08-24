package com.learnnow.dsa.dto.response;

import java.util.UUID;

/**
 * A step in the sheet view. Problems are not embedded: the step accordion pulls one page of them
 * from the per-step endpoint when it opens, so the sheet payload stays flat however long the sheet
 * grows.
 */
public record DsaStepDto(
        UUID id,
        String slug,
        int orderIndex,
        String title,
        String description,
        long totalProblems,
        long solvedProblems) {}
