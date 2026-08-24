package com.learnnow.dsa.dto.response;

import java.util.UUID;

/**
 * A sample case, which doubles as an Example block in the statement.
 *
 * <p>Only ever built from rows with {@code is_sample}. Hidden cases have no learner-facing DTO at
 * all, which is what keeps their input and expected output from leaking.
 */
public record DsaTestCaseDto(
        UUID id, int orderIndex, String input, String expectedOutput, String explanation) {}
