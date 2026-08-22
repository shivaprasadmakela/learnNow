package com.learnnow.notes.service;

import com.learnnow.notes.dto.response.BookmarkResponse;
import com.learnnow.notes.dto.response.NoteResponse;
import com.learnnow.notes.dto.response.TopicNoteResponse;
import com.learnnow.notes.entity.SubtopicNote;
import com.learnnow.notes.entity.TopicBookmark;
import com.learnnow.notes.entity.TopicNote;
import com.learnnow.notes.repository.SubtopicNoteRepository;
import com.learnnow.notes.repository.TopicBookmarkRepository;
import com.learnnow.notes.repository.TopicNoteRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotesService {

    private final SubtopicNoteRepository noteRepository;
    private final TopicNoteRepository topicNoteRepository;
    private final TopicBookmarkRepository bookmarkRepository;

    @Transactional
    public NoteResponse upsertNote(String userId, UUID subtopicId, String content) {
        SubtopicNote note =
                noteRepository
                        .findByUserIdAndSubtopicId(userId, subtopicId)
                        .orElseGet(
                                () ->
                                        SubtopicNote.builder()
                                                .userId(userId)
                                                .subtopicId(subtopicId)
                                                .content("")
                                                .build());

        note.setContent(content != null ? content : "");
        SubtopicNote saved = noteRepository.save(note);

        return new NoteResponse(
                saved.getId(),
                saved.getSubtopicId(),
                saved.getContent(),
                saved.getCreatedAt(),
                saved.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public Optional<NoteResponse> getNote(String userId, UUID subtopicId) {
        return noteRepository
                .findByUserIdAndSubtopicId(userId, subtopicId)
                .map(
                        n ->
                                new NoteResponse(
                                        n.getId(),
                                        n.getSubtopicId(),
                                        n.getContent(),
                                        n.getCreatedAt(),
                                        n.getUpdatedAt()));
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getAllNotes(String userId) {
        return noteRepository.findAllByUserId(userId).stream()
                .map(
                        n ->
                                new NoteResponse(
                                        n.getId(),
                                        n.getSubtopicId(),
                                        n.getContent(),
                                        n.getCreatedAt(),
                                        n.getUpdatedAt()))
                .toList();
    }

    @Transactional
    public TopicNoteResponse upsertTopicNote(String userId, UUID topicId, String content) {
        TopicNote note =
                topicNoteRepository
                        .findByUserIdAndTopicId(userId, topicId)
                        .orElseGet(
                                () ->
                                        TopicNote.builder()
                                                .userId(userId)
                                                .topicId(topicId)
                                                .content("")
                                                .build());

        note.setContent(content != null ? content : "");
        return toResponse(topicNoteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public Optional<TopicNoteResponse> getTopicNote(String userId, UUID topicId) {
        return topicNoteRepository.findByUserIdAndTopicId(userId, topicId).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<TopicNoteResponse> getAllTopicNotes(String userId) {
        return topicNoteRepository.findAllByUserId(userId).stream().map(this::toResponse).toList();
    }

    private TopicNoteResponse toResponse(TopicNote note) {
        return new TopicNoteResponse(
                note.getId(),
                note.getTopicId(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt());
    }

    @Transactional
    public boolean toggleBookmark(String userId, UUID topicId) {
        Optional<TopicBookmark> existing =
                bookmarkRepository.findByUserIdAndTopicId(userId, topicId);
        if (existing.isPresent()) {
            bookmarkRepository.deleteByUserIdAndTopicId(userId, topicId);
            return false; // unbookmarked
        } else {
            TopicBookmark bookmark =
                    TopicBookmark.builder().userId(userId).topicId(topicId).build();
            bookmarkRepository.save(bookmark);
            return true; // bookmarked
        }
    }

    @Transactional(readOnly = true)
    public List<BookmarkResponse> getAllBookmarks(String userId) {
        return bookmarkRepository.findAllByUserId(userId).stream()
                .map(b -> new BookmarkResponse(b.getId(), b.getTopicId(), b.getCreatedAt()))
                .toList();
    }
}
