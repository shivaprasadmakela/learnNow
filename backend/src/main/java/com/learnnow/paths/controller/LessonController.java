package com.learnnow.paths.controller;

import com.learnnow.paths.dto.response.SubtopicDto;
import com.learnnow.paths.service.CatalogService;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * One lesson at a time: the study console asks for a lesson's text, code and concept check when the
 * learner reaches it, rather than receiving every lesson of the topic at once. Signed-in only, like
 * the topic it belongs to.
 */
@RestController
@RequestMapping("/api/subtopics")
@RequiredArgsConstructor
public class LessonController {

    private final CatalogService catalogService;

    @GetMapping("/{id}")
    public ResponseEntity<SubtopicDto> getLesson(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return catalogService
                .getLesson(id, jwt.getSubject())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** What a runnable snippet should print, asked for after the learner has run it. */
    @GetMapping("/{id}/snippets/{snippetId}/expected-output")
    public ResponseEntity<Map<String, String>> getExpectedOutput(
            @PathVariable UUID id, @PathVariable String snippetId) {
        return catalogService
                .getExpectedOutput(id, snippetId)
                .map(out -> ResponseEntity.ok(Map.of("expectedOutput", out)))
                .orElse(ResponseEntity.notFound().build());
    }
}
