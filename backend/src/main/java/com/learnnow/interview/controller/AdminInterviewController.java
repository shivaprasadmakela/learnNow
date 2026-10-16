package com.learnnow.interview.controller;

import com.learnnow.interview.dto.request.ImportInterviewBankRequest;
import com.learnnow.interview.dto.request.RecordSightingRequest;
import com.learnnow.interview.dto.response.InterviewImportResultDto;
import com.learnnow.interview.dto.response.SightingResultDto;
import com.learnnow.interview.service.InterviewService;
import com.learnnow.interview.service.InterviewSightingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Imports interview bank files from learnNow-content, and records where questions were reported as
 * asked. Admin only, by the /api/admin/** rule.
 */
@RestController
@RequestMapping("/api/admin/interview")
@RequiredArgsConstructor
public class AdminInterviewController {

    private final InterviewService interviewService;
    private final InterviewSightingService sightingService;

    /** Upserts by key, so re-running an import updates the bank in place. */
    @PostMapping("/import")
    public ResponseEntity<InterviewImportResultDto> importBank(
            @Valid @RequestBody ImportInterviewBankRequest request) {
        return ResponseEntity.ok(interviewService.importBank(request));
    }

    /**
     * Records one report of questions being asked. A second request with the same source link adds
     * its questions to that report instead of creating another.
     */
    @PostMapping("/sightings")
    public ResponseEntity<SightingResultDto> recordSighting(
            @Valid @RequestBody RecordSightingRequest request) {
        return ResponseEntity.ok(sightingService.record(request));
    }
}
