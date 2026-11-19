package com.learnnow.trainer.home;

import com.learnnow.trainer.readiness.TopicReadiness;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The trainer home and the learner's readiness per topic. */
@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
public class TrainerHomeController {

    private final TrainerHomeService homeService;

    @GetMapping("/home")
    public ResponseEntity<TrainerHomeResponse> home(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(homeService.home(jwt.getSubject()));
    }

    @GetMapping("/readiness")
    public ResponseEntity<List<TopicReadiness>> readiness(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(homeService.readiness(jwt.getSubject()));
    }
}
