package com.learnnow.dsa.controller;

import com.learnnow.common.dto.PageRequests;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.dsa.dto.response.DsaProblemRowDto;
import com.learnnow.dsa.dto.response.DsaSheetDetailDto;
import com.learnnow.dsa.dto.response.DsaSheetSummaryDto;
import com.learnnow.dsa.service.DsaCatalogService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Public browse endpoints for the sheet.
 *
 * <p>Readable without a token so the sheet is linkable from a video description and indexable.
 * Progress counts simply come back as zero for an anonymous caller rather than the endpoint
 * refusing them.
 */
@RestController
@RequestMapping("/api/dsa")
@RequiredArgsConstructor
public class DsaSheetController {

    private final DsaCatalogService catalogService;

    @GetMapping("/sheets")
    public ResponseEntity<PageResponse<DsaSheetSummaryDto>> listSheets(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(
                catalogService.listSheets(subject(jwt), PageRequests.of(page, size)));
    }

    @GetMapping("/sheets/{slug}")
    public ResponseEntity<DsaSheetDetailDto> sheetBySlug(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String slug) {
        return ResponseEntity.ok(catalogService.sheetBySlug(slug, subject(jwt)));
    }

    /** One page of a step's problems. Default 10, and the accordion scrolls for the rest. */
    @GetMapping("/steps/{stepId}/problems")
    public ResponseEntity<PageResponse<DsaProblemRowDto>> problemsForStep(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID stepId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(
                catalogService.problemsForStep(stepId, subject(jwt), PageRequests.of(page, size)));
    }

    private static String subject(Jwt jwt) {
        return jwt != null ? jwt.getSubject() : null;
    }
}
