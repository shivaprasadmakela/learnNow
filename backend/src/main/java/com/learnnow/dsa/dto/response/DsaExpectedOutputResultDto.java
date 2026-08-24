package com.learnnow.dsa.dto.response;

import java.util.List;

/** Outcome of generating expected outputs from a problem's reference solution. */
public record DsaExpectedOutputResultDto(
        String language,
        int casesWritten,
        boolean succeeded,
        String failureReason,
        List<String> generatedOutputs) {}
