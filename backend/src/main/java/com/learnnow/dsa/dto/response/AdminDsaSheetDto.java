package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

public record AdminDsaSheetDto(
        UUID id,
        String slug,
        String title,
        String description,
        String playlistUrl,
        String status,
        List<AdminDsaStepDto> steps) {

    public record AdminDsaStepDto(
            UUID id,
            String slug,
            int orderIndex,
            String title,
            String description,
            List<AdminDsaSectionDto> sections) {}

    /**
     * A section in the authoring tree. Flat list in tree order, with {@code depth} for indentation
     * rather than actual nesting - the admin view is a table, and indenting a flat list is simpler
     * to render and to scan than nested containers.
     */
    public record AdminDsaSectionDto(
            UUID id,
            int orderIndex,
            int depth,
            String title,
            List<AdminDsaProblemRowDto> problems) {}

    public record AdminDsaProblemRowDto(
            UUID id,
            String slug,
            String title,
            String difficulty,
            String status,
            int orderIndex,
            boolean hasVideo,
            int harnessCount,
            int testCaseCount,
            int missingExpectedCount) {}
}
