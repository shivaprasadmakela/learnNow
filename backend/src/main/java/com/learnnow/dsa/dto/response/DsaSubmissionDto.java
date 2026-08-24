package com.learnnow.dsa.dto.response;

import java.time.Instant;
import java.util.UUID;

public record DsaSubmissionDto(
        UUID id,
        String language,
        String code,
        String verdict,
        int passedCount,
        int totalCount,
        Integer runtimeMs,
        Long memoryKb,
        Instant createdAt) {}
