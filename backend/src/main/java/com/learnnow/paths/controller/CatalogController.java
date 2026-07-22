package com.learnnow.paths.controller;

import com.learnnow.paths.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
     * List all paths with their topic summaries (no user progress data).
     */
    @GetMapping("/paths")
    public ResponseEntity<List<?>> getAllPaths() {
        return ResponseEntity.ok(catalogService.getAllPaths());
    }

    /**
     * Get a single path with topic details and subtopic titles (no content, no user progress).
     */
    @GetMapping("/paths/{pathId}")
    public ResponseEntity<CatalogPathDetail> getPathDetail(@PathVariable Long pathId) {
        return catalogService.getPathCatalogDetail(pathId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- Inner record DTOs for public catalog (no user-specific data) ---

    public record CatalogSubtopicTitle(Long id, String title, int orderIndex) {}

    public record CatalogTopicDetail(
            Long id, String title, String description,
            String category, String duration,
            List<CatalogSubtopicTitle> subtopics
    ) {}

    public record CatalogPathDetail(
            Long id, String title, String description,
            String category, String managedBy,
            List<CatalogTopicDetail> topics
    ) {}
}
