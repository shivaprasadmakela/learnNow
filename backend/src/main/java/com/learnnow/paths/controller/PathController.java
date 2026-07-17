package com.learnnow.paths.controller;

import com.learnnow.paths.entity.Path;
import com.learnnow.paths.repository.PathRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/paths")
public class PathController {

    private final PathRepository pathRepository;

    public PathController(PathRepository pathRepository) {
        this.pathRepository = pathRepository;
    }

    @GetMapping
    public ResponseEntity<List<Path>> getAllPaths() {
        return ResponseEntity.ok(pathRepository.findAll());
    }
}
