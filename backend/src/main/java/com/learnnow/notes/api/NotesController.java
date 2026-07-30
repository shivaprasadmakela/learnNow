package com.learnnow.notes.api;

import com.learnnow.notes.api.dto.BookmarkResponse;
import com.learnnow.notes.api.dto.NoteRequest;
import com.learnnow.notes.api.dto.NoteResponse;
import com.learnnow.notes.application.NotesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class NotesController {

    private final NotesService notesService;

    @GetMapping("/notes")
    public ResponseEntity<List<NoteResponse>> getAllNotes(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(notesService.getAllNotes(userId));
    }

    @GetMapping("/notes/subtopics/{subtopicId}")
    public ResponseEntity<NoteResponse> getSubtopicNote(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID subtopicId) {
        String userId = jwt.getSubject();
        return notesService.getNote(userId, subtopicId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new NoteResponse(null, subtopicId, "", null, null)));
    }

    @PutMapping("/notes/subtopics/{subtopicId}")
    public ResponseEntity<NoteResponse> upsertSubtopicNote(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID subtopicId,
            @Valid @RequestBody NoteRequest request) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(notesService.upsertNote(userId, subtopicId, request.content()));
    }

    @PostMapping("/bookmarks/topics/{topicId}")
    public ResponseEntity<Map<String, Boolean>> toggleBookmark(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID topicId) {
        String userId = jwt.getSubject();
        boolean isBookmarked = notesService.toggleBookmark(userId, topicId);
        return ResponseEntity.ok(Map.of("bookmarked", isBookmarked));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<List<BookmarkResponse>> getAllBookmarks(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(notesService.getAllBookmarks(userId));
    }
}
