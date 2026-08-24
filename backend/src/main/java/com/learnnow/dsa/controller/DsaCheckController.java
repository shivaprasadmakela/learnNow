package com.learnnow.dsa.controller;

import com.learnnow.dsa.dto.request.DsaCheckAnswerRequest;
import com.learnnow.dsa.dto.response.DsaCheckAnswerDto;
import com.learnnow.dsa.service.DsaSubmissionService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * The inline "now your turn" question in a statement.
 *
 * <p>This is the only endpoint that reveals a check's correct answer, and only after comparing
 * server-side. The DTO the learner receives with the problem has no field for it, so the answer
 * cannot be read out of the page source the way an inline answer key could.
 */
@RestController
@RequestMapping("/api/dsa/checks")
@RequiredArgsConstructor
public class DsaCheckController {

    private final DsaSubmissionService submissionService;

    @PostMapping("/{checkId}/answer")
    public ResponseEntity<DsaCheckAnswerDto> answerCheck(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID checkId,
            @Valid @RequestBody DsaCheckAnswerRequest request) {
        return ResponseEntity.ok(submissionService.answerCheck(jwt.getSubject(), checkId, request));
    }
}
