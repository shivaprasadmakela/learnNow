package com.learnnow.dsa.dto.response;

import java.util.UUID;

public record AdminDsaTestCaseDto(
        UUID id,
        int orderIndex,
        String input,
        String expectedOutput,
        boolean sample,
        String explanation) {}
