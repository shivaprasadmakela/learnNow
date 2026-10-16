package com.learnnow.tracks.controller;

import com.learnnow.tracks.dto.response.TrackDetailDto;
import com.learnnow.tracks.dto.response.TrackSummaryDto;
import com.learnnow.tracks.service.TrackService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Career tracks, readable without signing in like the rest of the catalog. A signed-in learner's
 * request carries their token, and then every step comes back with their progress and the roadmap
 * with the lesson to continue from.
 *
 * <p>Not paged: there are a handful of tracks, each one route through paths that are themselves
 * paged wherever they are listed.
 */
@RestController
@RequestMapping("/api/catalog/tracks")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    @GetMapping
    public ResponseEntity<List<TrackSummaryDto>> listTracks(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(trackService.listTracks(jwt != null ? jwt.getSubject() : null));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<TrackDetailDto> getTrack(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String slug) {
        return trackService
                .getTrack(slug, jwt != null ? jwt.getSubject() : null)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
