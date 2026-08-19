package com.learnnow.admin.controller;

import com.learnnow.admin.dto.request.CreateTopicRequest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.dto.response.TopicResponse;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.paths.entity.Topic;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AdminTopicController {

    private final ContentAuthoringService authoringService;

    @GetMapping("/api/admin/topics")
    public ResponseEntity<List<AdminPathDto.AdminTopicDto>> getAllTopics() {
        return ResponseEntity.ok(authoringService.getAllAdminTopics());
    }

    @PostMapping("/api/admin/paths/{pathId}/topics")
    public ResponseEntity<TopicResponse> createTopic(
            @PathVariable UUID pathId, @Valid @RequestBody CreateTopicRequest request) {
        Topic topic = authoringService.createTopic(pathId, request);
        TopicResponse response =
                new TopicResponse(
                        topic.getId(),
                        topic.getTitle(),
                        topic.getDescription(),
                        topic.getCategory(),
                        topic.getDuration(),
                        topic.getOrderIndex(),
                        topic.getStatus() != null ? topic.getStatus().name() : null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/admin/paths/{pathId}/topics/{topicId}/attach")
    public ResponseEntity<Void> attachTopic(
            @PathVariable UUID pathId,
            @PathVariable UUID topicId,
            @RequestParam(required = false) Integer orderIndex) {
        authoringService.attachTopicToPath(pathId, topicId, orderIndex);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/api/admin/paths/{pathId}/topics/{topicId}")
    public ResponseEntity<Void> unlinkTopic(@PathVariable UUID pathId, @PathVariable UUID topicId) {
        authoringService.unlinkTopicFromPath(pathId, topicId);
        return ResponseEntity.noContent().build();
    }
}
