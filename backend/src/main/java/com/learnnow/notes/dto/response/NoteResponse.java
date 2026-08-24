package com.learnnow.notes.dto.response;

import com.learnnow.notes.entity.Note;
import com.learnnow.notes.entity.NoteTarget;
import java.time.Instant;
import java.util.UUID;

/**
 * One note, whatever it is attached to.
 *
 * <p>{@code target} plus {@code targetId} replaces the three shapes this used to have. The legacy
 * {@code subtopicId} and {@code topicId} fields are still emitted so the study console keeps
 * working unchanged - they are populated only when the note actually points at one.
 */
public record NoteResponse(
        UUID id,
        NoteTarget target,
        UUID targetId,
        String content,
        Instant createdAt,
        Instant updatedAt,
        UUID subtopicId,
        UUID topicId,
        UUID dsaProblemId) {

    public static NoteResponse from(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getTarget(),
                note.getTargetId(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                note.getSubtopicId(),
                note.getTopicId(),
                note.getDsaProblemId());
    }

    /** An unsaved note, so a first GET returns an empty body rather than a 404. */
    public static NoteResponse empty(NoteTarget target, UUID targetId) {
        return new NoteResponse(
                null,
                target,
                targetId,
                "",
                null,
                null,
                target == NoteTarget.SUBTOPIC ? targetId : null,
                target == NoteTarget.TOPIC ? targetId : null,
                target == NoteTarget.DSA_PROBLEM ? targetId : null);
    }
}
