package com.learnnow.trainer.interview.controller;

import com.learnnow.trainer.interview.dto.TranscriptCallbackRequest;
import com.learnnow.trainer.interview.service.TopicInterviewService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/ai/interviews")
@Slf4j
public class InternalInterviewController {

    private final TopicInterviewService interviewService;
    private final String serviceToken;

    public InternalInterviewController(
            TopicInterviewService interviewService,
            @Value("${learnnow.ai.service-token:}") String serviceToken) {
        this.interviewService = interviewService;
        this.serviceToken = serviceToken;
    }

    @PostMapping("/{id}/transcript")
    public ResponseEntity<Void> receiveTranscript(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody TranscriptCallbackRequest request) {
        if (serviceToken.isBlank() || authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String givenToken = authHeader.substring(7).trim();
        byte[] given = givenToken.getBytes(StandardCharsets.UTF_8);
        byte[] expected = serviceToken.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(given, expected)) {
            log.warn("Unauthorized internal callback attempt for interview {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        interviewService.recordTranscript(id, request);
        return ResponseEntity.ok().build();
    }
}
