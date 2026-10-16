package com.learnnow.interview.controller;

import com.learnnow.interview.dto.response.InterviewQuestionDto;
import com.learnnow.interview.dto.response.InterviewTopicDto;
import com.learnnow.interview.service.InterviewService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Interview questions, readable without signing in like the rest of the catalog. */
@RestController
@RequestMapping("/api/catalog/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    /** Every topic of the path that has questions, in the path's order. */
    @GetMapping("/paths/{pathId}")
    public ResponseEntity<List<InterviewTopicDto>> forPath(@PathVariable UUID pathId) {
        return interviewService
                .forPath(pathId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/subtopics/{subtopicId}")
    public ResponseEntity<List<InterviewQuestionDto>> forSubtopic(@PathVariable UUID subtopicId) {
        return ResponseEntity.ok(interviewService.forSubtopic(subtopicId));
    }
}
