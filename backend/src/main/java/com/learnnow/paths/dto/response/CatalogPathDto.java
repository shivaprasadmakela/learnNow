package com.learnnow.paths.dto.response;

import java.util.UUID;

public record CatalogPathDto(
        UUID id, String title, String description, String category, String managedBy) {}
