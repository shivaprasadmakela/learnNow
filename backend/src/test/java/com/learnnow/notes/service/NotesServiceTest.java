package com.learnnow.notes.service;

import static org.junit.jupiter.api.Assertions.*;

import com.learnnow.notes.dto.response.BookmarkResponse;
import com.learnnow.notes.dto.response.NoteResponse;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("local")
public class NotesServiceTest {

    @Autowired private NotesService notesService;

    @Autowired private UserRepository userRepository;

    @Autowired private PathRepository pathRepository;

    @Autowired private TopicRepository topicRepository;

    @Autowired private SubtopicRepository subtopicRepository;

    private User testUser;
    private Topic testTopic;
    private Subtopic testSubtopic;

    @BeforeEach
    public void setUp() {
        testUser =
                userRepository.save(
                        User.builder()
                                .id("test-user-notes-" + UUID.randomUUID())
                                .email("testnotes" + UUID.randomUUID() + "@example.com")
                                .passwordHash("hashed")
                                .build());

        Path path =
                pathRepository.save(
                        Path.builder().title("Test Path").status(ContentStatus.PUBLISHED).build());

        testTopic =
                topicRepository.save(
                        Topic.builder()
                                .title("Test Topic")
                                .path(path)
                                .status(ContentStatus.PUBLISHED)
                                .orderIndex(1)
                                .build());

        testSubtopic =
                subtopicRepository.save(
                        Subtopic.builder()
                                .title("Test Subtopic")
                                .topic(testTopic)
                                .orderIndex(1)
                                .status(ContentStatus.PUBLISHED)
                                .build());
    }

    @Test
    @Transactional
    public void testUpsertAndRetrieveNote() {
        String userId = testUser.getId();
        UUID subtopicId = testSubtopic.getId();

        // 1. Initial note should be empty
        assertTrue(notesService.getNote(userId, subtopicId).isEmpty());

        // 2. Create note
        NoteResponse created =
                notesService.upsertNote(userId, subtopicId, "My personal study note");
        assertNotNull(created.id());
        assertEquals(subtopicId, created.subtopicId());
        assertEquals("My personal study note", created.content());

        // 3. Retrieve note
        NoteResponse retrieved = notesService.getNote(userId, subtopicId).orElseThrow();
        assertEquals("My personal study note", retrieved.content());

        // 4. Update note
        NoteResponse updated = notesService.upsertNote(userId, subtopicId, "Updated personal note");
        assertEquals(created.id(), updated.id());
        assertEquals("Updated personal note", updated.content());

        // 5. Get all notes for user
        List<NoteResponse> allNotes = notesService.getAllNotes(userId);
        assertEquals(1, allNotes.size());
    }

    @Test
    @Transactional
    public void testToggleBookmark() {
        String userId = testUser.getId();
        UUID topicId = testTopic.getId();

        // 1. Initial bookmarks empty
        assertTrue(notesService.getAllBookmarks(userId).isEmpty());

        // 2. Toggle ON
        boolean isBookmarked = notesService.toggleBookmark(userId, topicId);
        assertTrue(isBookmarked);

        List<BookmarkResponse> bookmarks = notesService.getAllBookmarks(userId);
        assertEquals(1, bookmarks.size());
        assertEquals(topicId, bookmarks.get(0).topicId());

        // 3. Toggle OFF
        boolean unbookmarked = notesService.toggleBookmark(userId, topicId);
        assertFalse(unbookmarked);

        assertTrue(notesService.getAllBookmarks(userId).isEmpty());
    }
}
