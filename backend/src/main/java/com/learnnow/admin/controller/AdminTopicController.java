package com.learnnow.admin.controller;

import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The global topic library, independent of any path. */
@RestController
@RequestMapping("/api/admin/topics")
@RequiredArgsConstructor
public class AdminTopicController {

    private final ContentAuthoringService authoringService;

    @GetMapping
    public ResponseEntity<List<AdminPathDto.AdminTopicDto>> getAllTopics() {
        return ResponseEntity.ok(authoringService.getAllAdminTopics());
    }
}
