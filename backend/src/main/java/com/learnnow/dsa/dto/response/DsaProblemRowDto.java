package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * One row in a step's problem list. Deliberately small - no statement, no notes, no harness.
 *
 * <p>{@code sectionPath} is the problem's full ancestry, root first. The client groups a flat page
 * of these back into a tree, which is why nesting deeper costs nothing here: a fourth level is one
 * more entry in the list, not a new field or a new endpoint.
 */
public record DsaProblemRowDto(
        UUID id,
        String slug,
        String title,
        String difficulty,
        int estimatedMinutes,
        List<String> tags,
        boolean hasVideo,
        String practiceUrl,
        String practicePlatform,
        List<DsaSectionRefDto> sectionPath,
        String status,
        boolean bookmarked) {}
