package com.learnnow.admin.api.dto;

import java.util.List;

public record ImportValidationResultDto(
    boolean hasConflicts,
    List<ImportConflictItemDto> conflicts
) {}
