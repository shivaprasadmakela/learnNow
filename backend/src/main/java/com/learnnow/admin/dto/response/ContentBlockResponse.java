package com.learnnow.admin.dto.response;

import java.util.UUID;

public record ContentBlockResponse(
    UUID id,
    int orderIndex,
    String type,
    String body
) {}
