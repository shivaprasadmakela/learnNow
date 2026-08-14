package com.learnnow.paths.controller;

import com.learnnow.paths.dto.response.CatalogPathDto;
import com.learnnow.paths.service.CatalogService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

    /** List all published paths for public catalog display (without topics/subtopics). */
    @GetMapping("/paths")
    public ResponseEntity<List<CatalogPathDto>> getPublicCatalogPaths() {
        return ResponseEntity.ok(catalogService.getPublicCatalogPaths());
    }
}
