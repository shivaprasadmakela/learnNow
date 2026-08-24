package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * The admin view of a problem: everything, including the material the learner-facing DTO has no
 * field for.
 *
 * <p>Kept as a separate record from {@link DsaProblemDetailDto} on purpose. One shared DTO with a
 * flag deciding what to populate is how hidden test data eventually escapes.
 */
public record AdminDsaProblemDto(
        UUID id,
        String slug,
        String title,
        String statement,
        String difficulty,
        List<String> tags,
        int estimatedMinutes,
        String youtubeUrl,
        Integer youtubePosition,
        String practiceUrl,
        String practicePlatform,
        String status,
        UUID sectionId,
        int orderIndex,
        List<DsaApproachDto> approaches,
        List<DsaHintDto> hints,
        List<AdminDsaHarnessDto> harnesses,
        List<AdminDsaTestCaseDto> testCases,
        List<AdminDsaCheckDto> checks) {}
