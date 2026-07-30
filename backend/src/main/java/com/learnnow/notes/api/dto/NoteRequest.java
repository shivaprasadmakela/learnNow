package com.learnnow.notes.api.dto;

import jakarta.validation.constraints.NotNull;

public record NoteRequest(
    @NotNull String content
) {}
