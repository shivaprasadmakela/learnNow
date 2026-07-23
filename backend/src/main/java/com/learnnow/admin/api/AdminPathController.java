package com.learnnow.admin.api;

import com.learnnow.admin.api.dto.AdminPathDto;
import com.learnnow.admin.api.dto.CreatePathRequest;
import com.learnnow.admin.application.ContentAuthoringService;
import com.learnnow.admin.application.PublishService;
import com.learnnow.paths.entity.Path;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/paths")
@RequiredArgsConstructor
public class AdminPathController {

    private final ContentAuthoringService authoringService;
    private final PublishService publishService;

    @GetMapping
    public ResponseEntity<List<AdminPathDto>> getAllPaths() {
        return ResponseEntity.ok(authoringService.getAllAdminPaths());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminPathDto> getPathById(@PathVariable UUID id) {
        return authoringService.getAdminPathById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AdminPathDto> savePath(@RequestBody AdminPathDto dto) {
        return ResponseEntity.ok(authoringService.saveOrUpdatePath(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminPathDto> updatePath(@PathVariable UUID id, @RequestBody AdminPathDto dto) {
        AdminPathDto toSave = new AdminPathDto(
                id,
                dto.title(),
                dto.description(),
                dto.category(),
                dto.managedBy(),
                dto.status(),
                dto.topics()
        );
        return ResponseEntity.ok(authoringService.saveOrUpdatePath(toSave));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<Path> publishPath(@PathVariable UUID id) {
        Path path = publishService.publishPath(id);
        return ResponseEntity.ok(path);
    }
}
