package com.learnnow.trainer.plan.controller;

import com.learnnow.trainer.plan.dto.WeeklyPlanResponse;
import com.learnnow.trainer.plan.service.WeeklyPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The learner's weekly study plan: read this week's, or have the trainer write it (again). */
@RestController
@RequestMapping("/api/trainer/plan")
@RequiredArgsConstructor
public class WeeklyPlanController {

    private final WeeklyPlanService planService;

    @GetMapping
    public ResponseEntity<WeeklyPlanResponse> current(@AuthenticationPrincipal Jwt jwt) {
        return planService
                .current(jwt.getSubject())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<WeeklyPlanResponse> generate(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(planService.generate(jwt.getSubject()));
    }
}
