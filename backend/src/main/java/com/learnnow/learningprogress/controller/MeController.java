package com.learnnow.learningprogress.controller;

import com.learnnow.learningprogress.dto.request.SetTopicCompletionRequest;
import com.learnnow.learningprogress.dto.response.ActivityFeedItem;
import com.learnnow.learningprogress.dto.response.DashboardResponse;
import com.learnnow.learningprogress.dto.response.PaginatedActivitiesResponse;
import com.learnnow.learningprogress.entity.LearningActivityEvent;
import com.learnnow.learningprogress.repository.LearningActivityEventRepository;
import com.learnnow.learningprogress.service.DashboardService;
import com.learnnow.learningprogress.service.ProgressService;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final DashboardService dashboardService;
    private final ProgressService progressService;
    private final LearningActivityEventRepository eventRepository;
    private final PathRepository pathRepository;
    private final TopicRepository topicRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(dashboardService.buildDashboard(userId));
    }

    @GetMapping("/activities")
    public ResponseEntity<PaginatedActivitiesResponse> getActivities(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit) {
        
        String userId = jwt.getSubject();

        Instant cursorTime = null;
        UUID cursorId = null;
        if (cursor != null && !cursor.isBlank()) {
            try {
                String decoded = new String(Base64.getDecoder().decode(cursor));
                String[] parts = decoded.split("\\|");
                if (parts.length == 2) {
                    cursorTime = Instant.parse(parts[0]);
                    cursorId = UUID.fromString(parts[1]);
                }
            } catch (Exception e) {
                // Ignore invalid cursor format
            }
        }

        List<LearningActivityEvent> events;
        if (cursorTime != null && cursorId != null) {
            events = eventRepository.findCursorPaginated(userId, cursorTime, cursorId, PageRequest.of(0, limit));
        } else {
            events = eventRepository.findByUserIdOrderByOccurredAtDesc(userId, PageRequest.of(0, limit));
        }

        Map<Long, String> pathTitles = pathRepository.findAll().stream()
                .collect(Collectors.toMap(Path::getId, Path::getTitle, (a, b) -> a));
        Map<Long, String> topicTitles = topicRepository.findAll().stream()
                .collect(Collectors.toMap(Topic::getId, Topic::getTitle, (a, b) -> a));
        List<ActivityFeedItem> items = events.stream()
                .map(ev -> new ActivityFeedItem(
                        ev.getId().toString(),
                        ev.getEventType().name(),
                        ev.getPointsAwarded(),
                        ev.getOccurredAt(),
                        ev.getPathId() != null ? pathTitles.get(ev.getPathId()) : null,
                        ev.getTopicId() != null ? topicTitles.get(ev.getTopicId()) : null
                ))
                .toList();

        String nextCursor = null;
        if (events.size() >= limit && !events.isEmpty()) {
            LearningActivityEvent lastEvent = events.get(events.size() - 1);
            nextCursor = Base64.getEncoder().encodeToString(
                    (lastEvent.getOccurredAt().toString() + "|" + lastEvent.getId().toString()).getBytes());
        }

        return ResponseEntity.ok(new PaginatedActivitiesResponse(items, nextCursor));
    }

    @PutMapping("/topics/{topicId}/completion")
    public ResponseEntity<Void> setTopicCompletion(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long topicId,
            @RequestBody SetTopicCompletionRequest request) {
        String userId = jwt.getSubject();
        progressService.setTopicCompletion(userId, topicId, request.completed(), request.eventId());
        return ResponseEntity.ok().build();
    }

}
