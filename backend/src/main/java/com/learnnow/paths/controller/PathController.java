package com.learnnow.paths.controller;

import com.learnnow.common.dto.PageRequests;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.paths.dto.response.PathSummaryDto;
import com.learnnow.paths.dto.response.TopicSummaryDto;
import com.learnnow.paths.service.CatalogService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/paths")
public class PathController {

    private final CatalogService catalogService;

    public PathController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    /** One page of paths (metadata + progress for the authenticated user). */
    @GetMapping
    public ResponseEntity<PageResponse<PathSummaryDto>> getAllPaths(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        String userId = jwt != null ? jwt.getSubject() : null;
        return ResponseEntity.ok(catalogService.getAllPaths(userId, PageRequests.of(page, size)));
    }

    /** Get single path details including the first page of its topics. */
    @GetMapping("/{pathId}")
    public ResponseEntity<PathSummaryDto> getPathDetails(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID pathId) {
        String userId = jwt != null ? jwt.getSubject() : null;
        return catalogService
                .getPathDetails(pathId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** One page of topics for a specific path. */
    @GetMapping("/{pathId}/topics")
    public ResponseEntity<PageResponse<TopicSummaryDto>> getTopicsForPath(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID pathId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        String userId = jwt != null ? jwt.getSubject() : null;
        return ResponseEntity.ok(
                catalogService.getTopicsForPath(pathId, userId, PageRequests.of(page, size)));
    }
}
