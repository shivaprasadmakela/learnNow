package com.learnnow.dsa.controller;

import com.learnnow.common.dto.PageRequests;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.dsa.dto.request.DsaStatusRequest;
import com.learnnow.dsa.dto.response.*;
import com.learnnow.dsa.entity.DsaProgressStatus;
import com.learnnow.dsa.service.DsaCatalogService;
import com.learnnow.dsa.service.DsaProgressService;
import com.learnnow.dsa.service.DsaSubmissionService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * A learner's own DSA data. Everything here requires a token.
 *
 * <p>Notes and bookmarks are deliberately absent: they live on {@code /api/me/notes/dsa-problems/}
 * and {@code /api/me/bookmarks/dsa-problems/} alongside every other kind of note and bookmark, so
 * there is one place to look for them rather than one per feature.
 */
@RestController
@RequestMapping("/api/me/dsa")
@RequiredArgsConstructor
public class MeDsaController {

    private final DsaProgressService progressService;
    private final DsaCatalogService catalogService;
    private final DsaSubmissionService submissionService;

    /**
     * Manual status override.
     *
     * <p>Kept for problems that have no harness yet, where the learner's own word is the only
     * signal there is. Where a problem is judgeable, Submit is what should be moving this.
     */
    @PutMapping("/problems/{problemId}/status")
    public ResponseEntity<DsaProblemProgressDto> setStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID problemId,
            @Valid @RequestBody DsaStatusRequest request) {

        DsaProgressStatus status;
        try {
            status = DsaProgressStatus.valueOf(request.status().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("dsa_invalid_status");
        }

        String userId = jwt.getSubject();
        progressService.setStatus(userId, problemId, status, null);
        return ResponseEntity.ok(progressService.progressFor(userId, problemId));
    }

    @GetMapping("/problems/{problemId}/submissions")
    public ResponseEntity<PageResponse<DsaSubmissionDto>> submissions(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID problemId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(
                submissionService.submissions(
                        jwt.getSubject(), problemId, PageRequests.of(page, size)));
    }

    /** Feeds the dashboard tile. 204 when no sheet is published yet. */
    @GetMapping("/summary")
    public ResponseEntity<DsaSummaryDto> summary(@AuthenticationPrincipal Jwt jwt) {
        return catalogService
                .summaryFor(jwt.getSubject())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
