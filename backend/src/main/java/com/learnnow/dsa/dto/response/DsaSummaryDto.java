package com.learnnow.dsa.dto.response;

import java.util.Map;
import java.util.UUID;

/** The dashboard tile's payload. */
public record DsaSummaryDto(
        UUID sheetId,
        String sheetSlug,
        String sheetTitle,
        long totalProblems,
        long solvedProblems,
        Map<String, Long> totalByDifficulty,
        Map<String, Long> solvedByDifficulty,
        String nextProblemSlug,
        String nextProblemTitle,
        String nextProblemStepSlug) {}
