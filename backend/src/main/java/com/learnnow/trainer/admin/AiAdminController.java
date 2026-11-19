package com.learnnow.trainer.admin;

import com.learnnow.trainer.feature.AiFeature;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The admin AI page. ADMIN only, like every /api/admin route (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
public class AiAdminController {

    private final AiAdminService adminService;

    public record FlagRequest(boolean enabled) {}

    @GetMapping
    public ResponseEntity<AiAdminResponse> overview() {
        return ResponseEntity.ok(adminService.overview());
    }

    @PutMapping("/flags/{feature}")
    public ResponseEntity<Void> setFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable AiFeature feature,
            @RequestBody FlagRequest request) {
        adminService.setFlag(feature, request.enabled(), jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}
