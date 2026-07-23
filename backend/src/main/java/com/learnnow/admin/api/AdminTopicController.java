package com.learnnow.admin.api;

import com.learnnow.admin.api.dto.CreateTopicRequest;
import com.learnnow.admin.application.ContentAuthoringService;
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
    public ResponseEntity<Topic> createTopic(
            @PathVariable UUID pathId,
            @Valid @RequestBody CreateTopicRequest request) {
        Topic topic = authoringService.createTopic(pathId, request);
        return ResponseEntity.ok(topic);
    }
}
