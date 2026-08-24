package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * Result of a Submit.
 *
 * <p>{@code newlySolved} exists so the UI knows whether to celebrate: re-submitting an already
 * accepted solution is accepted, but awards nothing and should not fire the confetti a second time.
 */
public record DsaSubmitResultDto(
        UUID submissionId,
        String verdict,
        int passedCount,
        int totalCount,
        Integer firstFailedCase,
        List<DsaCaseResultDto> cases,
        String compileOutput,
        String stderr,
        Integer runtimeMs,
        Long memoryKb,
        boolean newlySolved,
        int pointsAwarded) {}
