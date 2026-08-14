package com.learnnow.admin.dto.response;

import java.util.UUID;

public record TopicResponse(
        UUID id,
        String title,
        String description,
        String category,
        String duration,
        int orderIndex,
        String status) {}
