package com.learnnow.paths.controller;

import com.learnnow.paths.dto.response.PathSummaryDto;
import com.learnnow.paths.dto.response.TopicSummaryDto;
import com.learnnow.paths.service.CatalogService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/paths")
public class PathController {

    private final CatalogService catalogService;

    public PathController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    /** Get all paths (metadata only, without eager topics). */
    @GetMapping
    public ResponseEntity<List<PathSummaryDto>> getAllPaths() {
        return ResponseEntity.ok(catalogService.getAllPaths());
    }

    /** Get single path details including its topics. */
    @GetMapping("/{pathId}")
    public ResponseEntity<PathSummaryDto> getPathDetails(@PathVariable UUID pathId) {
        return catalogService
                .getPathDetails(pathId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Get topics for a specific path. */
    @GetMapping("/{pathId}/topics")
    public ResponseEntity<List<TopicSummaryDto>> getTopicsForPath(@PathVariable UUID pathId) {
        return ResponseEntity.ok(catalogService.getTopicsForPath(pathId));
    }
}
