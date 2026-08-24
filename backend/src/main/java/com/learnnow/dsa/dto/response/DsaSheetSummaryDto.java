package com.learnnow.dsa.dto.response;

import java.util.UUID;

public record DsaSheetSummaryDto(
        UUID id,
        String slug,
        String title,
        String description,
        String playlistUrl,
        long totalProblems,
        long solvedProblems) {}
