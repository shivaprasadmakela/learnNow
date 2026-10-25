package com.learnnow.trainer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * One message to the trainer, with the conversation so far. The conversation lives in the browser
 * and is not stored: what is worth keeping becomes a trainer note.
 *
 * <p>{@code page} says where the learner is, so "explain this" means the lesson on screen.
 */
public record ChatRequest(
        @NotEmpty @Size(max = 40) List<@Valid Turn> messages,
        @Valid PageRef page,
        boolean quizInProgress) {

    public record Turn(
            @NotBlank @Pattern(regexp = "user|assistant") String role,
            @NotBlank @Size(max = 4000) String content) {}

    public record PageRef(
            @NotBlank @Pattern(regexp = "subtopic|topic|dashboard|paths|track") String kind,
            UUID id) {}
}
