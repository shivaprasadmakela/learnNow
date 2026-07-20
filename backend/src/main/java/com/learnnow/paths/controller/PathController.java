package com.learnnow.paths.controller;

import com.learnnow.paths.dto.PathSummaryDto;
import com.learnnow.paths.service.CatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/paths")
public class PathController {

    private final CatalogService catalogService;

    public PathController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public ResponseEntity<List<PathSummaryDto>> getAllPaths() {
        return ResponseEntity.ok(catalogService.getAllPaths());
    }
}
