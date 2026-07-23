package com.learnnow.admin.api;

import com.learnnow.admin.application.PublishService;
import com.learnnow.paths.entity.Subtopic;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/subtopics")
@RequiredArgsConstructor
public class AdminPublishController {

    private final PublishService publishService;

    @PostMapping("/{id}/publish")
    public ResponseEntity<Subtopic> publishSubtopic(@PathVariable UUID id) {
        Subtopic subtopic = publishService.publishSubtopic(id);
        return ResponseEntity.ok(subtopic);
    }
}
