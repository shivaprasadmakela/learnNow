package com.learnnow.trainer.interview.controller;

import com.learnnow.trainer.interview.dto.InterviewAvailabilityResponse;
import com.learnnow.trainer.interview.dto.MockAvailabilityResponse;
import com.learnnow.trainer.interview.dto.RatingRequest;
import com.learnnow.trainer.interview.dto.RetryInterviewRequest;
import com.learnnow.trainer.interview.dto.StartInterviewResponse;
import com.learnnow.trainer.interview.dto.StartMockInterviewRequest;
import com.learnnow.trainer.interview.dto.TopicInterviewReportResponse;
import com.learnnow.trainer.interview.dto.TopicInterviewSummaryResponse;
import com.learnnow.trainer.interview.service.TopicInterviewService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trainer/interviews")
public class TopicInterviewController {

    private final TopicInterviewService interviewService;

    public TopicInterviewController(TopicInterviewService interviewService) {
        this.interviewService = interviewService;
    }

    public record StartTopicInterviewRequest(UUID topicId) {}

    @GetMapping
    public ResponseEntity<?> getInterviews(
            @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) UUID topicId) {
        String userId = jwt.getSubject();
        if (topicId != null) {
            InterviewAvailabilityResponse resp = interviewService.availability(userId, topicId);
            return ResponseEntity.ok(resp);
        }
        List<TopicInterviewSummaryResponse> history = interviewService.history(userId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/availability")
    public ResponseEntity<InterviewAvailabilityResponse> getAvailability(
            @AuthenticationPrincipal Jwt jwt, @RequestParam UUID topicId) {
        InterviewAvailabilityResponse resp =
                interviewService.availability(jwt.getSubject(), topicId);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/start")
    public ResponseEntity<StartInterviewResponse> startInterviewExplicit(
            @AuthenticationPrincipal Jwt jwt, @RequestBody StartTopicInterviewRequest request) {
        StartInterviewResponse response =
                interviewService.start(jwt.getSubject(), request.topicId());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<StartInterviewResponse> startInterview(
            @AuthenticationPrincipal Jwt jwt, @RequestBody StartTopicInterviewRequest request) {
        StartInterviewResponse response =
                interviewService.start(jwt.getSubject(), request.topicId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mock/availability")
    public ResponseEntity<MockAvailabilityResponse> getMockAvailability(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(interviewService.mockAvailability(jwt.getSubject()));
    }

    /** Writing the plan takes learnnow-ai 10-20 seconds, so this answers slowly. */
    @PostMapping("/mock")
    public ResponseEntity<StartInterviewResponse> startMockInterview(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody StartMockInterviewRequest request) {
        return ResponseEntity.ok(
                interviewService.startMock(
                        jwt.getSubject(),
                        request.kind(),
                        request.role(),
                        request.useJobDescription()));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<StartInterviewResponse> retryQuestion(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestBody RetryInterviewRequest request) {
        return ResponseEntity.ok(
                interviewService.retry(jwt.getSubject(), id, request.questionId()));
    }

    @PutMapping("/{id}/rating")
    public ResponseEntity<Void> rate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody RatingRequest request) {
        interviewService.rate(jwt.getSubject(), id, request.rating(), request.comment());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TopicInterviewReportResponse> getReport(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        TopicInterviewReportResponse report = interviewService.report(jwt.getSubject(), id);
        return ResponseEntity.ok(report);
    }
}
