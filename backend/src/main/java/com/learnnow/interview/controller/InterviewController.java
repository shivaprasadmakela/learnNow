package com.learnnow.interview.controller;

import com.learnnow.interview.dto.response.InterviewAnswerDto;
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

/**
 * Interview questions, readable without signing in like the rest of the catalog - but only as far
 * as the learner has gone: a path's topics with their counts, then a topic's questions as prompts,
 * then one question's answer when it is revealed. Nothing arrives before the screen that shows it.
 */
@RestController
@RequestMapping("/api/catalog/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    /** Every topic of the path that has questions, in the path's order, with counts only. */
    @GetMapping("/paths/{pathId}")
    public ResponseEntity<List<InterviewTopicDto>> forPath(@PathVariable UUID pathId) {
        return interviewService
                .forPath(pathId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** A topic's opening questions in lesson order, prompts only. Empty when it has none. */
    @GetMapping("/topics/{topicId}")
    public ResponseEntity<List<InterviewQuestionDto>> forTopic(@PathVariable UUID topicId) {
        return ResponseEntity.ok(interviewService.forTopic(topicId));
    }

    /** One question's answer and the follow-ups it unlocks - what "Reveal answer" shows. */
    @GetMapping("/questions/{questionId}")
    public ResponseEntity<InterviewAnswerDto> answer(@PathVariable UUID questionId) {
        return interviewService
                .answer(questionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
