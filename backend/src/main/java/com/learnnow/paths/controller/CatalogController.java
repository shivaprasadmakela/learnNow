package com.learnnow.paths.controller;

import com.learnnow.common.dto.PageRequests;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.paths.dto.response.CatalogPathDto;
import com.learnnow.paths.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public catalog endpoints — accessible without authentication. Non-logged-in users can browse
 * paths to see available courses. Clicking a path redirects to login to view topics and content.
 */
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    /**
     * One page of published paths for public catalog display (without topics/subtopics). Defaults
     * to the first {@value PageRequests#DEFAULT_PAGE_SIZE} for the landing grid, which then scrolls
     * to load the rest.
     */
    @GetMapping("/paths")
    public ResponseEntity<PageResponse<CatalogPathDto>> getPublicCatalogPaths(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(catalogService.getPublicCatalogPaths(PageRequests.of(page, size)));
    }
}
