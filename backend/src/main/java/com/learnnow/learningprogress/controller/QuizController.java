package com.learnnow.learningprogress.controller;

import com.learnnow.learningprogress.dto.request.QuizSubmitRequest;
import com.learnnow.learningprogress.dto.response.QuizSubmitResponse;
import com.learnnow.learningprogress.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @PostMapping("/submit")
    public ResponseEntity<QuizSubmitResponse> submitQuiz(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody QuizSubmitRequest request) {
        // The endpoint requires authentication, so the principal is always present.
        String userId = jwt.getSubject();
        QuizSubmitResponse response = quizService.validateAndSubmitQuiz(userId, request);
        return ResponseEntity.ok(response);
    }
}
