package com.learnnow.learningprogress.controller;

import com.learnnow.learningprogress.dto.request.SetTopicCompletionRequest;
import com.learnnow.learningprogress.dto.response.DashboardResponse;
import com.learnnow.learningprogress.service.DashboardService;
import com.learnnow.learningprogress.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final DashboardService dashboardService;
    private final ProgressService progressService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(dashboardService.buildDashboard(userId));
    }

    @PutMapping("/topics/{topicId}/completion")
    public ResponseEntity<Void> setTopicCompletion(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID topicId,
            @RequestBody SetTopicCompletionRequest request) {
        String userId = jwt.getSubject();
        progressService.setTopicCompletion(userId, topicId, request.completed());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/subtopics/{subtopicId}/completion")
    public ResponseEntity<Void> setSubtopicCompletion(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID subtopicId,
            @RequestParam(defaultValue = "true") boolean completed) {
        String userId = jwt.getSubject();
        progressService.markSubtopicComplete(userId, subtopicId, completed);
        return ResponseEntity.ok().build();
    }
}
