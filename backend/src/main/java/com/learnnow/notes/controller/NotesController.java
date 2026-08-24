package com.learnnow.notes.controller;

import com.learnnow.notes.dto.request.NoteRequest;
import com.learnnow.notes.dto.response.BookmarkResponse;
import com.learnnow.notes.dto.response.BookmarkToggleResponse;
import com.learnnow.notes.dto.response.NoteResponse;
import com.learnnow.notes.entity.NoteTarget;
import com.learnnow.notes.service.NotesService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Notes and bookmarks.
 *
 * <p>The per-target-type paths ({@code /notes/subtopics/{id}} and friends) are kept rather than
 * collapsed into one {@code /notes/{type}/{id}} route: they are already in use by the study
 * console, and a path segment that must match an enum is a worse API than three explicit routes.
 * Each one is two lines over the shared service.
 */
@RestController
@RequestMapping("/api/me") // notes + bookmarks; progress lives in MeController
@RequiredArgsConstructor
public class NotesController {

    private final NotesService notesService;

    // ---------------------------------------------------------------- notes

    /**
     * Every note the learner has, of any kind.
     *
     * <p>{@code ?target=} narrows it to one kind. Absent means all of them, which is what a "my
     * notes" screen wants.
     */
    @GetMapping("/notes")
    public ResponseEntity<List<NoteResponse>> getAllNotes(
            @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) NoteTarget target) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(
                target == null
                        ? notesService.getAllNotes(userId)
                        : notesService.getNotes(userId, target));
    }

    @GetMapping("/notes/subtopics/{subtopicId}")
    public ResponseEntity<NoteResponse> getSubtopicNote(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID subtopicId) {
        return ResponseEntity.ok(note(jwt, NoteTarget.SUBTOPIC, subtopicId));
    }

    @PutMapping("/notes/subtopics/{subtopicId}")
    public ResponseEntity<NoteResponse> upsertSubtopicNote(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID subtopicId,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(
                notesService.upsertNote(
                        jwt.getSubject(), NoteTarget.SUBTOPIC, subtopicId, request.content()));
    }

    @GetMapping("/notes/topics/{topicId}")
    public ResponseEntity<NoteResponse> getTopicNote(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID topicId) {
        return ResponseEntity.ok(note(jwt, NoteTarget.TOPIC, topicId));
    }

    @PutMapping("/notes/topics/{topicId}")
    public ResponseEntity<NoteResponse> upsertTopicNote(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID topicId,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(
                notesService.upsertNote(
                        jwt.getSubject(), NoteTarget.TOPIC, topicId, request.content()));
    }

    @GetMapping("/notes/dsa-problems/{problemId}")
    public ResponseEntity<NoteResponse> getDsaProblemNote(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID problemId) {
        return ResponseEntity.ok(note(jwt, NoteTarget.DSA_PROBLEM, problemId));
    }

    @PutMapping("/notes/dsa-problems/{problemId}")
    public ResponseEntity<NoteResponse> upsertDsaProblemNote(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID problemId,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(
                notesService.upsertNote(
                        jwt.getSubject(), NoteTarget.DSA_PROBLEM, problemId, request.content()));
    }

    /** An absent note reads as an empty one, so the editor opens blank instead of erroring. */
    private NoteResponse note(Jwt jwt, NoteTarget target, UUID targetId) {
        return notesService
                .getNote(jwt.getSubject(), target, targetId)
                .orElseGet(() -> NoteResponse.empty(target, targetId));
    }

    // ------------------------------------------------------------ bookmarks

    /** {@code ?target=TOPIC} or {@code ?target=DSA_PROBLEM} to filter; absent returns both. */
    @GetMapping("/bookmarks")
    public ResponseEntity<List<BookmarkResponse>> getBookmarks(
            @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) NoteTarget target) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(
                target == null
                        ? notesService.getAllBookmarks(userId)
                        : notesService.getBookmarks(userId, target));
    }

    @PostMapping("/bookmarks/topics/{topicId}")
    public ResponseEntity<BookmarkToggleResponse> toggleTopicBookmark(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID topicId) {
        return ResponseEntity.ok(
                new BookmarkToggleResponse(
                        notesService.toggleBookmark(jwt.getSubject(), NoteTarget.TOPIC, topicId)));
    }

    @PostMapping("/bookmarks/dsa-problems/{problemId}")
    public ResponseEntity<BookmarkToggleResponse> toggleDsaProblemBookmark(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID problemId) {
        return ResponseEntity.ok(
                new BookmarkToggleResponse(
                        notesService.toggleBookmark(
                                jwt.getSubject(), NoteTarget.DSA_PROBLEM, problemId)));
    }
}
