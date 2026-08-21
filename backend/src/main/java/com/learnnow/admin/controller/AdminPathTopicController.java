package com.learnnow.admin.controller;

import com.learnnow.admin.dto.request.CreateTopicRequest;
import com.learnnow.admin.dto.response.TopicResponse;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.paths.entity.Topic;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Manages which topics belong to a path.
 *
 * <p>Split out of {@code AdminTopicController} so every admin controller owns exactly one base
 * path; previously three of them shared {@code /api/admin} and the owner of a given route could not
 * be found from any single file.
 */
@RestController
@RequestMapping("/api/admin/paths/{pathId}/topics")
@RequiredArgsConstructor
public class AdminPathTopicController {

    private final ContentAuthoringService authoringService;

    @PostMapping
    public ResponseEntity<TopicResponse> createTopic(
            @PathVariable UUID pathId, @Valid @RequestBody CreateTopicRequest request) {
        Topic topic = authoringService.createTopic(pathId, request);
        return ResponseEntity.ok(
                new TopicResponse(
                        topic.getId(),
                        topic.getTitle(),
                        topic.getDescription(),
                        topic.getCategory(),
                        topic.getDuration(),
                        topic.getOrderIndex(),
                        topic.getStatus() != null ? topic.getStatus().name() : null));
    }

    @PostMapping("/{topicId}/attach")
    public ResponseEntity<Void> attachTopic(
            @PathVariable UUID pathId,
            @PathVariable UUID topicId,
            @RequestParam(required = false) Integer orderIndex) {
        authoringService.attachTopicToPath(pathId, topicId, orderIndex);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{topicId}")
    public ResponseEntity<Void> unlinkTopic(@PathVariable UUID pathId, @PathVariable UUID topicId) {
        authoringService.unlinkTopicFromPath(pathId, topicId);
        return ResponseEntity.noContent().build();
    }
}
