package com.learnnow.admin.controller;

import com.learnnow.admin.dto.request.*;
import com.learnnow.admin.dto.response.*;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.admin.service.PublishService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return authoringService
                .getAdminPathById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AdminPathDto> savePath(@Valid @RequestBody AdminPathDto dto) {
        return ResponseEntity.ok(authoringService.saveOrUpdatePath(dto));
    }

    @PostMapping("/import/validate")
    public ResponseEntity<ImportValidationResultDto> validateImport(
            @Valid @RequestBody ImportCourseRequest request) {
        ImportValidationResultDto result = authoringService.validateImportConflicts(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/import")
    public ResponseEntity<ImportResultDto> importCourse(
            @Valid @RequestBody ImportCourseRequest request) {
        ImportResultDto result = authoringService.importCourse(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminPathDto> updatePath(
            @PathVariable UUID id, @Valid @RequestBody AdminPathDto dto) {
        AdminPathDto toSave =
                new AdminPathDto(
                        id,
                        dto.title(),
                        dto.description(),
                        dto.category(),
                        dto.managedBy(),
                        dto.status(),
                        dto.topics());
        return ResponseEntity.ok(authoringService.saveOrUpdatePath(toSave));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<AdminPathDto> publishPath(@PathVariable UUID id) {
        AdminPathDto dto = publishService.publishPath(id);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePath(@PathVariable UUID id) {
        authoringService.deletePath(id);
        return ResponseEntity.noContent().build();
    }
}
