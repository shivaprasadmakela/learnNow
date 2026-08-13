package com.learnnow.admin.controller;

import com.learnnow.admin.dto.request.CreateTopicRequest;
import com.learnnow.admin.dto.response.TopicResponse;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.paths.entity.Topic;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/paths/{pathId}/topics")
@RequiredArgsConstructor
public class AdminTopicController {

    private final ContentAuthoringService authoringService;

    @PostMapping
    public ResponseEntity<TopicResponse> createTopic(
            @PathVariable UUID pathId,
            @Valid @RequestBody CreateTopicRequest request) {
        Topic topic = authoringService.createTopic(pathId, request);
        TopicResponse response = new TopicResponse(
                topic.getId(),
                topic.getTitle(),
                topic.getDescription(),
                topic.getCategory(),
                topic.getDuration(),
                topic.getOrderIndex(),
                topic.getStatus() != null ? topic.getStatus().name() : null
        );
        return ResponseEntity.ok(response);
    }
}
