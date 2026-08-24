package com.learnnow.notes.dto.response;

import com.learnnow.notes.entity.Bookmark;
import com.learnnow.notes.entity.NoteTarget;
import java.time.Instant;
import java.util.UUID;

/**
 * One bookmark.
 *
 * <p>{@code topicId} is retained alongside {@code targetId} because the dashboard's bookmark list
 * reads it directly; for a DSA bookmark it is null and {@code dsaProblemId} carries the id instead.
 */
public record BookmarkResponse(
        UUID id,
        NoteTarget target,
        UUID targetId,
        Instant createdAt,
        UUID topicId,
        UUID dsaProblemId) {

    public static BookmarkResponse from(Bookmark bookmark) {
        return new BookmarkResponse(
                bookmark.getId(),
                bookmark.getTarget(),
                bookmark.getTargetId(),
                bookmark.getCreatedAt(),
                bookmark.getTopicId(),
                bookmark.getDsaProblemId());
    }
}
