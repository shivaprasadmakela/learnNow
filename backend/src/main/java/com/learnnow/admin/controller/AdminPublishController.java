package com.learnnow.admin.controller;

import com.learnnow.admin.dto.response.SubtopicResponse;
import com.learnnow.admin.service.PublishService;
import com.learnnow.paths.entity.Subtopic;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/subtopics")
@RequiredArgsConstructor
public class AdminPublishController {

    private final PublishService publishService;

    @PostMapping("/{id}/publish")
    public ResponseEntity<SubtopicResponse> publishSubtopic(@PathVariable UUID id) {
        Subtopic subtopic = publishService.publishSubtopic(id);
        SubtopicResponse response =
                new SubtopicResponse(
                        subtopic.getId(),
                        subtopic.getTitle(),
                        subtopic.getOrderIndex(),
                        subtopic.getStatus() != null ? subtopic.getStatus().name() : null);
        return ResponseEntity.ok(response);
    }
}
