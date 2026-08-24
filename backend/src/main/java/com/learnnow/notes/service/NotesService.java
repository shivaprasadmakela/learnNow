package com.learnnow.notes.service;

import com.learnnow.notes.dto.response.BookmarkResponse;
import com.learnnow.notes.dto.response.NoteResponse;
import com.learnnow.notes.entity.Bookmark;
import com.learnnow.notes.entity.Note;
import com.learnnow.notes.entity.NoteTarget;
import com.learnnow.notes.repository.BookmarkRepository;
import com.learnnow.notes.repository.NoteRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Notes and bookmarks for every kind of content.
 *
 * <p>Both used to be per-target-type: two notes tables and a topic-only bookmarks table, with DSA
 * about to add a third and a fourth. Everything here now takes a {@link NoteTarget}, so adding
 * another kind of noteable thing is a column and an enum value rather than a parallel set of
 * methods, endpoints and DTOs.
 */
@Service
@RequiredArgsConstructor
public class NotesService {

    private final NoteRepository noteRepository;
    private final BookmarkRepository bookmarkRepository;

    // ---------------------------------------------------------------- notes

    @Transactional
    public NoteResponse upsertNote(
            String userId, NoteTarget target, UUID targetId, String content) {
        Note note =
                findNote(userId, target, targetId)
                        .orElseGet(
                                () -> {
                                    Note fresh = Note.builder().userId(userId).content("").build();
                                    fresh.pointAt(target, targetId);
                                    return fresh;
                                });

        note.setContent(content != null ? content : "");
        return NoteResponse.from(noteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public Optional<NoteResponse> getNote(String userId, NoteTarget target, UUID targetId) {
        return findNote(userId, target, targetId).map(NoteResponse::from);
    }

    /** Every note the learner has written, newest first. */
    @Transactional(readOnly = true)
    public List<NoteResponse> getAllNotes(String userId) {
        return noteRepository.findAllByUserId(userId).stream().map(NoteResponse::from).toList();
    }

    /** The learner's notes of one kind, for a filtered view. */
    @Transactional(readOnly = true)
    public List<NoteResponse> getNotes(String userId, NoteTarget target) {
        List<Note> notes =
                switch (target) {
                    case SUBTOPIC -> noteRepository.findSubtopicNotesByUserId(userId);
                    case TOPIC -> noteRepository.findTopicNotesByUserId(userId);
                    case DSA_PROBLEM -> noteRepository.findDsaNotesByUserId(userId);
                };
        return notes.stream().map(NoteResponse::from).toList();
    }

    private Optional<Note> findNote(String userId, NoteTarget target, UUID targetId) {
        return switch (target) {
            case SUBTOPIC -> noteRepository.findByUserIdAndSubtopicId(userId, targetId);
            case TOPIC -> noteRepository.findByUserIdAndTopicId(userId, targetId);
            case DSA_PROBLEM -> noteRepository.findByUserIdAndDsaProblemId(userId, targetId);
        };
    }

    // ------------------------------------------------------------ bookmarks

    /**
     * @return true if the target is now bookmarked, false if the bookmark was removed.
     */
    @Transactional
    public boolean toggleBookmark(String userId, NoteTarget target, UUID targetId) {
        Optional<Bookmark> existing = findBookmark(userId, target, targetId);
        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            return false;
        }

        Bookmark.BookmarkBuilder builder = Bookmark.builder().userId(userId);
        if (target == NoteTarget.TOPIC) {
            builder.topicId(targetId);
        } else {
            builder.dsaProblemId(targetId);
        }
        bookmarkRepository.save(builder.build());
        return true;
    }

    @Transactional(readOnly = true)
    public List<BookmarkResponse> getAllBookmarks(String userId) {
        return bookmarkRepository.findAllByUserId(userId).stream()
                .map(BookmarkResponse::from)
                .toList();
    }

    /**
     * Bookmarks of one kind.
     *
     * <p>{@code target} is nullable at the controller edge so the same endpoint serves the
     * unfiltered list; a null there calls {@link #getAllBookmarks} instead of reaching this.
     */
    @Transactional(readOnly = true)
    public List<BookmarkResponse> getBookmarks(String userId, NoteTarget target) {
        List<Bookmark> bookmarks =
                target == NoteTarget.TOPIC
                        ? bookmarkRepository.findTopicBookmarksByUserId(userId)
                        : bookmarkRepository.findDsaBookmarksByUserId(userId);
        return bookmarks.stream().map(BookmarkResponse::from).toList();
    }

    /**
     * Which of these problems the learner has bookmarked.
     *
     * <p>One query for a whole page of rows, rather than asking per row - the sheet list renders
     * ten at a time and every one of them needs to know.
     */
    @Transactional(readOnly = true)
    public Set<UUID> bookmarkedProblemIds(String userId, List<UUID> problemIds) {
        if (userId == null || userId.isBlank() || problemIds == null || problemIds.isEmpty()) {
            return Set.of();
        }
        return bookmarkRepository.findBookmarkedProblemIds(userId, problemIds).stream()
                .collect(Collectors.toSet());
    }

    private Optional<Bookmark> findBookmark(String userId, NoteTarget target, UUID targetId) {
        return target == NoteTarget.TOPIC
                ? bookmarkRepository.findByUserIdAndTopicId(userId, targetId)
                : bookmarkRepository.findByUserIdAndDsaProblemId(userId, targetId);
    }
}
