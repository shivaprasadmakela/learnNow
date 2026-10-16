package com.learnnow.tracks.controller;

import com.learnnow.tracks.dto.request.ImportTrackRequest;
import com.learnnow.tracks.dto.response.TrackImportResultDto;
import com.learnnow.tracks.service.TrackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Imports a track file from learnNow-content. Admin only, by the /api/admin/** rule. */
@RestController
@RequestMapping("/api/admin/tracks")
@RequiredArgsConstructor
public class AdminTrackController {

    private final TrackService trackService;

    /** Upserts by slug, so re-running an import updates the track in place. */
    @PostMapping("/import")
    public ResponseEntity<TrackImportResultDto> importTrack(
            @Valid @RequestBody ImportTrackRequest request) {
        return ResponseEntity.ok(trackService.importTrack(request));
    }
}
