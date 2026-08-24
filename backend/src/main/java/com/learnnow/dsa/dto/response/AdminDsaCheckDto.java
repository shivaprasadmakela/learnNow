package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

public record AdminDsaCheckDto(
        UUID id,
        int orderIndex,
        String prompt,
        List<String> options,
        String correctAnswer,
        String explanation,
        int points) {}
