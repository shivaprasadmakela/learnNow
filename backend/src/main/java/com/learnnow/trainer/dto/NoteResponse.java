package com.learnnow.trainer.dto;

import com.learnnow.trainer.entity.TrainerNote;
import java.time.Instant;
import java.util.UUID;

public record NoteResponse(UUID id, String kind, String text, String source, Instant createdAt) {

    public static NoteResponse from(TrainerNote note) {
        return new NoteResponse(
                note.getId(),
                note.getKind(),
                note.getText(),
                note.getSource(),
                note.getCreatedAt());
    }
}
