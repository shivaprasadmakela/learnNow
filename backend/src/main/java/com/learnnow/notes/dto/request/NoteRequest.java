package com.learnnow.notes.dto.request;

import jakarta.validation.constraints.NotNull;

public record NoteRequest(@NotNull String content) {}
