package com.learnnow.admin.dto.response;

import java.util.UUID;

public record SubtopicResponse(UUID id, String title, int orderIndex, String status) {}
