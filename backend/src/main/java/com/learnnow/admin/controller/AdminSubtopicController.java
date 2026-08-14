package com.learnnow.admin.controller;

import com.learnnow.admin.dto.request.CreateContentBlockRequest;
import com.learnnow.admin.dto.request.CreateSubtopicRequest;
import com.learnnow.admin.dto.response.ContentBlockResponse;
import com.learnnow.admin.dto.response.SubtopicResponse;
import com.learnnow.admin.entity.ContentBlock;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.paths.entity.Subtopic;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminSubtopicController {

    private final ContentAuthoringService authoringService;

    @PostMapping("/topics/{topicId}/subtopics")
    public ResponseEntity<SubtopicResponse> createSubtopic(
            @PathVariable UUID topicId, @Valid @RequestBody CreateSubtopicRequest request) {
        Subtopic subtopic = authoringService.createSubtopic(topicId, request);
        SubtopicResponse response =
                new SubtopicResponse(
                        subtopic.getId(),
                        subtopic.getTitle(),
                        subtopic.getOrderIndex(),
                        subtopic.getStatus() != null ? subtopic.getStatus().name() : null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subtopics/{subtopicId}/blocks")
    public ResponseEntity<ContentBlockResponse> addContentBlock(
            @PathVariable UUID subtopicId, @RequestBody CreateContentBlockRequest request) {
        ContentBlock block = authoringService.addContentBlock(subtopicId, request);
        ContentBlockResponse response =
                new ContentBlockResponse(
                        block.getId(), block.getOrderIndex(), block.getType(), block.getBody());
        return ResponseEntity.ok(response);
    }
}
