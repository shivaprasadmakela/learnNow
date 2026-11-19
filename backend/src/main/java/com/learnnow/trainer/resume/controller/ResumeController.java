package com.learnnow.trainer.resume.controller;

import com.learnnow.trainer.resume.dto.ResumeMatchRequest;
import com.learnnow.trainer.resume.dto.ResumeProfileRequest;
import com.learnnow.trainer.resume.dto.ResumeResponse;
import com.learnnow.trainer.resume.service.ResumeService;
import jakarta.validation.Valid;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * The learner's resume: upload for review, correct what was read, match against a job, delete.
 * Reading and deleting work even when an admin has switched resume review off, because they are the
 * learner's own data.
 */
@RestController
@RequestMapping("/api/trainer/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @GetMapping
    public ResponseEntity<ResumeResponse> get(@AuthenticationPrincipal Jwt jwt) {
        return resumeService
                .get(jwt.getSubject())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeResponse> upload(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @RequestParam(value = "adultConfirmed", defaultValue = "false") boolean adultConfirmed)
            throws IOException {
        return ResponseEntity.ok(
                resumeService.upload(
                        jwt.getSubject(),
                        file.getBytes(),
                        file.getOriginalFilename(),
                        file.getContentType(),
                        targetRole,
                        adultConfirmed));
    }

    @PutMapping("/profile")
    public ResponseEntity<ResumeResponse> updateProfile(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ResumeProfileRequest request) {
        return ResponseEntity.ok(resumeService.updateProfile(jwt.getSubject(), request));
    }

    @PostMapping("/match")
    public ResponseEntity<ResumeResponse> match(
            @AuthenticationPrincipal Jwt jwt, @RequestBody ResumeMatchRequest request) {
        return ResponseEntity.ok(resumeService.match(jwt.getSubject(), request));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt) {
        resumeService.delete(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}
