package com.learnnow.notes.service;

import static org.junit.jupiter.api.Assertions.*;

import com.learnnow.notes.dto.response.BookmarkResponse;
import com.learnnow.notes.dto.response.NoteResponse;
import com.learnnow.notes.dto.response.TopicNoteResponse;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.PathTopic;
import com.learnnow.paths.entity.PathTopicId;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.PathTopicRepository;
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
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
public class NotesServiceTest extends com.learnnow.AbstractIntegrationTest {

    @Autowired private NotesService notesService;

    @Autowired private UserRepository userRepository;

    @Autowired private PathRepository pathRepository;
    @Autowired private PathTopicRepository pathTopicRepository;

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
                                .status(ContentStatus.PUBLISHED)
                                .orderIndex(1)
                                .build());
        // Membership lives in path_topics; a topic has no owning-path column.
        pathTopicRepository.save(
                PathTopic.builder()
                        .id(new PathTopicId(path.getId(), testTopic.getId()))
                        .path(path)
                        .topic(testTopic)
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
    public void testUpsertAndRetrieveTopicNote() {
        String userId = testUser.getId();
        UUID topicId = testTopic.getId();

        // 1. Initial topic note should be empty
        assertTrue(notesService.getTopicNote(userId, topicId).isEmpty());

        // 2. Create note
        TopicNoteResponse created =
                notesService.upsertTopicNote(userId, topicId, "Notes for the whole topic");
        assertNotNull(created.id());
        assertEquals(topicId, created.topicId());
        assertEquals("Notes for the whole topic", created.content());

        // 3. Retrieve note
        TopicNoteResponse retrieved = notesService.getTopicNote(userId, topicId).orElseThrow();
        assertEquals("Notes for the whole topic", retrieved.content());

        // 4. Update the same row rather than inserting a second one
        TopicNoteResponse updated =
                notesService.upsertTopicNote(userId, topicId, "Revised topic notes");
        assertEquals(created.id(), updated.id());
        assertEquals("Revised topic notes", updated.content());
        assertEquals(1, notesService.getAllTopicNotes(userId).size());

        // 5. Topic notes stay out of the subtopic notes collection
        assertTrue(notesService.getAllNotes(userId).isEmpty());
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
