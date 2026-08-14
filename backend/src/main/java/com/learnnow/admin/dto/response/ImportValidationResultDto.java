package com.learnnow.admin.dto.response;

import java.util.List;

public record ImportValidationResultDto(
        boolean hasConflicts, List<ImportConflictItemDto> conflicts) {}
