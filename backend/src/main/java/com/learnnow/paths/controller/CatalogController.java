package com.learnnow.paths.controller;

import com.learnnow.paths.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

/**
 * Public catalog endpoints — accessible without authentication.
 * Non-logged-in users can browse paths and see topic/subtopic titles,
 * but cannot see subtopic content or track progress.
 */
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    /**
     * List all published paths with their topic summaries.
     */
    @GetMapping("/paths")
    public ResponseEntity<List<?>> getAllPaths() {
        return ResponseEntity.ok(catalogService.getAllPaths());
    }

    /**
     * Get a single published path with topic details and subtopic titles.
     */
    @GetMapping("/paths/{pathId}")
    public ResponseEntity<CatalogPathDetail> getPathDetail(@PathVariable UUID pathId) {
        return catalogService.getPathCatalogDetail(pathId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- Inner record DTOs for public catalog ---

    public record CatalogSubtopicTitle(UUID id, String title, int orderIndex) {}

    public record CatalogTopicDetail(
            UUID id, String title, String description,
            String category, String duration,
            List<CatalogSubtopicTitle> subtopics
    ) {}

    public record CatalogPathDetail(
            UUID id, String title, String description,
            String category, String managedBy,
            List<CatalogTopicDetail> topics
    ) {}
}
