package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

public record DsaApproachDto(
        UUID id,
        String kind,
        int orderIndex,
        String intuition,
        String timeComplexity,
        String spaceComplexity,
        /** One entry per language, in a stable order. Empty when the approach is prose only. */
        List<DsaSolutionDto> solutions) {}
