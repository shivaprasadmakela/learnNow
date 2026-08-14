package com.learnnow.paths.dto;

import java.util.List;
import java.util.UUID;

public record AdminPathRequest(
        UUID id,
        String title,
        String description,
        String category,
        String managedBy,
        String status,
        List<AdminTopicRequest> topics) {}
