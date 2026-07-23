package com.learnnow.admin.api;

import com.learnnow.admin.api.dto.CreateContentBlockRequest;
import com.learnnow.admin.api.dto.CreateSubtopicRequest;
import com.learnnow.admin.application.ContentAuthoringService;
import com.learnnow.admin.persistence.ContentBlock;
import com.learnnow.paths.entity.Subtopic;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminSubtopicController {

    private final ContentAuthoringService authoringService;

    @PostMapping("/topics/{topicId}/subtopics")
    public ResponseEntity<Subtopic> createSubtopic(
            @PathVariable UUID topicId,
            @Valid @RequestBody CreateSubtopicRequest request) {
        Subtopic subtopic = authoringService.createSubtopic(topicId, request);
        return ResponseEntity.ok(subtopic);
    }

    @PostMapping("/subtopics/{subtopicId}/blocks")
    public ResponseEntity<ContentBlock> addContentBlock(
            @PathVariable UUID subtopicId,
            @RequestBody CreateContentBlockRequest request) {
        ContentBlock block = authoringService.addContentBlock(subtopicId, request);
        return ResponseEntity.ok(block);
    }
}
