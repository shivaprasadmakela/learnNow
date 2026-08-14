package com.learnnow.paths.dto;

import java.util.UUID;

public record AdminSubtopicRequest(
        UUID id, String title, String content, int orderIndex, String status) {}
