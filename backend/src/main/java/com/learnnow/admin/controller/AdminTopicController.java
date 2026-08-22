package com.learnnow.admin.controller;

import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.common.dto.PageRequests;
import com.learnnow.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The global topic library, independent of any path. */
@RestController
@RequestMapping("/api/admin/topics")
@RequiredArgsConstructor
public class AdminTopicController {

    private final ContentAuthoringService authoringService;

    /** One page of the library, ordered by title so the scrolling picker stays stable. */
    @GetMapping
    public ResponseEntity<PageResponse<AdminPathDto.AdminTopicDto>> getAllTopics(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(authoringService.getAllAdminTopics(PageRequests.of(page, size)));
    }
}
