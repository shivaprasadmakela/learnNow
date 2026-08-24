package com.learnnow.dsa.controller;

import com.learnnow.common.dto.PageRequests;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.dsa.dto.request.DsaHarnessRequest;
import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.dto.response.*;
import com.learnnow.dsa.service.DsaAuthoringService;
import com.learnnow.dsa.service.DsaImportService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authoring endpoints.
 *
 * <p>Covered by the existing {@code /api/admin/**} ADMIN rule, so there is no new authorisation
 * logic here.
 */
@RestController
@RequestMapping("/api/admin/dsa")
@RequiredArgsConstructor
public class AdminDsaController {

    private final DsaAuthoringService authoringService;
    private final DsaImportService importService;

    @GetMapping("/sheets")
    public ResponseEntity<PageResponse<AdminDsaSheetDto>> listSheets(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(authoringService.listSheets(PageRequests.of(page, size)));
    }

    @GetMapping("/sheets/{sheetId}")
    public ResponseEntity<AdminDsaSheetDto> sheetById(@PathVariable UUID sheetId) {
        return ResponseEntity.ok(authoringService.sheetById(sheetId));
    }

    @PostMapping("/sheets/{sheetId}/publish")
    public ResponseEntity<Void> publishSheet(@PathVariable UUID sheetId) {
        authoringService.publishSheet(sheetId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/problems/{problemId}")
    public ResponseEntity<AdminDsaProblemDto> problemById(@PathVariable UUID problemId) {
        return ResponseEntity.ok(authoringService.problemById(problemId));
    }

    @PutMapping("/problems/{problemId}/harness/{language}")
    public ResponseEntity<AdminDsaHarnessDto> upsertHarness(
            @PathVariable UUID problemId,
            @PathVariable String language,
            @Valid @RequestBody DsaHarnessRequest request) {
        return ResponseEntity.ok(authoringService.upsertHarness(problemId, language, request));
    }

    /**
     * Runs the reference solution over every test case and stores what it printed.
     *
     * <p>The alternative is hand-computing the answer to several hundred cases, so this is the
     * endpoint that makes authoring a sheet of this size tractable at all.
     */
    @PostMapping("/problems/{problemId}/expected/{language}")
    public ResponseEntity<DsaExpectedOutputResultDto> generateExpected(
            @PathVariable UUID problemId, @PathVariable String language) {
        return ResponseEntity.ok(authoringService.generateExpectedOutputs(problemId, language));
    }

    @PostMapping("/problems/{problemId}/publish")
    public ResponseEntity<Void> publishProblem(@PathVariable UUID problemId) {
        authoringService.publishProblem(problemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/problems/{problemId}")
    public ResponseEntity<Void> deleteProblem(@PathVariable UUID problemId) {
        authoringService.deleteProblem(problemId);
        return ResponseEntity.noContent().build();
    }

    /** Dry run: reports what an import would create and update, and writes nothing. */
    @PostMapping("/import/validate")
    public ResponseEntity<DsaImportResultDto> validateImport(
            @Valid @RequestBody DsaImportRequest request) {
        return ResponseEntity.ok(importService.validate(request));
    }

    @PostMapping("/import")
    public ResponseEntity<DsaImportResultDto> importContent(
            @Valid @RequestBody DsaImportRequest request) {
        return ResponseEntity.ok(importService.importContent(request));
    }
}
