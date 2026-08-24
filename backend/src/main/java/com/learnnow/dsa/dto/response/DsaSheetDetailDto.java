package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DsaSheetDetailDto(
        UUID id,
        String slug,
        String title,
        String description,
        String playlistUrl,
        long totalProblems,
        long solvedProblems,
        /** Published problem counts keyed by difficulty name, for the progress header. */
        Map<String, Long> totalByDifficulty,
        Map<String, Long> solvedByDifficulty,
        List<DsaStepDto> steps) {}
