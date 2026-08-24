package com.learnnow.dsa.dto.response;

import java.util.UUID;

public record DsaApproachDto(
        UUID id,
        String kind,
        int orderIndex,
        String intuition,
        String timeComplexity,
        String spaceComplexity,
        String language,
        String code) {}
