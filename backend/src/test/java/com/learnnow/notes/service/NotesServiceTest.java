package com.learnnow.notes.service;

import static org.junit.jupiter.api.Assertions.*;

import com.learnnow.notes.dto.response.BookmarkResponse;
import com.learnnow.notes.dto.response.NoteResponse;
import com.learnnow.notes.entity.NoteTarget;
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
        assertTrue(notesService.getNote(userId, NoteTarget.SUBTOPIC, subtopicId).isEmpty());

        // 2. Create note
        NoteResponse created =
                notesService.upsertNote(
                        userId, NoteTarget.SUBTOPIC, subtopicId, "My personal study note");
        assertNotNull(created.id());
        assertEquals(subtopicId, created.subtopicId());
        assertEquals(NoteTarget.SUBTOPIC, created.target());
        assertEquals("My personal study note", created.content());

        // 3. Retrieve note
        NoteResponse retrieved =
                notesService.getNote(userId, NoteTarget.SUBTOPIC, subtopicId).orElseThrow();
        assertEquals("My personal study note", retrieved.content());

        // 4. Update the same row rather than inserting a second one
        NoteResponse updated =
                notesService.upsertNote(
                        userId, NoteTarget.SUBTOPIC, subtopicId, "Updated personal note");
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
        assertTrue(notesService.getNote(userId, NoteTarget.TOPIC, topicId).isEmpty());

        // 2. Create note
        NoteResponse created =
                notesService.upsertNote(
                        userId, NoteTarget.TOPIC, topicId, "Notes for the whole topic");
        assertNotNull(created.id());
        assertEquals(topicId, created.topicId());
        assertEquals(NoteTarget.TOPIC, created.target());
        assertEquals("Notes for the whole topic", created.content());

        // 3. Retrieve note
        NoteResponse retrieved =
                notesService.getNote(userId, NoteTarget.TOPIC, topicId).orElseThrow();
        assertEquals("Notes for the whole topic", retrieved.content());

        // 4. Update the same row rather than inserting a second one
        NoteResponse updated =
                notesService.upsertNote(userId, NoteTarget.TOPIC, topicId, "Revised topic notes");
        assertEquals(created.id(), updated.id());
        assertEquals("Revised topic notes", updated.content());
        assertEquals(1, notesService.getNotes(userId, NoteTarget.TOPIC).size());

        // 5. Filtering by kind keeps them apart, even though they now share a table. Note that
        // getAllNotes has changed meaning: it used to return only subtopic notes, and now returns
        // every note the learner has, which is why this asserts on the filtered call.
        assertTrue(notesService.getNotes(userId, NoteTarget.SUBTOPIC).isEmpty());
        assertEquals(1, notesService.getAllNotes(userId).size());
    }

    @Test
    @Transactional
    public void testToggleBookmark() {
        String userId = testUser.getId();
        UUID topicId = testTopic.getId();

        // 1. Initial bookmarks empty
        assertTrue(notesService.getAllBookmarks(userId).isEmpty());

        // 2. Toggle ON
        boolean isBookmarked = notesService.toggleBookmark(userId, NoteTarget.TOPIC, topicId);
        assertTrue(isBookmarked);

        List<BookmarkResponse> bookmarks = notesService.getAllBookmarks(userId);
        assertEquals(1, bookmarks.size());
        assertEquals(topicId, bookmarks.get(0).topicId());
        assertEquals(NoteTarget.TOPIC, bookmarks.get(0).target());

        // 3. Filtering by kind separates topic bookmarks from DSA ones
        assertEquals(1, notesService.getBookmarks(userId, NoteTarget.TOPIC).size());
        assertTrue(notesService.getBookmarks(userId, NoteTarget.DSA_PROBLEM).isEmpty());

        // 4. Toggle OFF
        boolean unbookmarked = notesService.toggleBookmark(userId, NoteTarget.TOPIC, topicId);
        assertFalse(unbookmarked);

        assertTrue(notesService.getAllBookmarks(userId).isEmpty());
    }
}
