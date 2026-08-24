package com.learnnow.dsa.dto.response;

import java.util.List;

/**
 * Result of a Run: sample cases plus anything the learner typed into the panel.
 *
 * <p>{@code compileOutput} and {@code stderr} come straight from the engine, with line numbers
 * already rewritten to the learner's own numbering.
 */
public record DsaRunResultDto(
        String verdict,
        int passedCount,
        int totalCount,
        Integer firstFailedCase,
        List<DsaCaseResultDto> cases,
        String compileOutput,
        String stderr,
        String stdout,
        Integer runtimeMs,
        Long memoryKb) {}
