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
     * A section in the authoring tree, sent as a flat list in tree order.
     *
     * <p>It stays flat over the wire and is rebuilt into a tree on the client. {@code depth} alone
     * would be enough to do that from a correctly ordered list, but {@code parentSectionId} is sent
     * as well so the rebuild is a lookup rather than a guess - a list that arrives out of order
     * then renders wrongly instead of silently reparenting a whole subtree.
     */
    public record AdminDsaSectionDto(
            UUID id,
            UUID parentSectionId,
            int orderIndex,
            int depth,
            String title,
            String description,
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
