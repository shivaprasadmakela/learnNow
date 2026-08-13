package com.learnnow.paths.controller;

import com.learnnow.paths.dto.response.TopicDetailDto;
import com.learnnow.paths.service.CatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.UUID;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final CatalogService catalogService;

    public TopicController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<TopicDetailDto> getTopicDetails(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        String userId = jwt.getSubject();
        return catalogService.getTopicDetails(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
