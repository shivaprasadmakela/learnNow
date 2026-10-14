package com.learnnow.admin.service;

import static org.junit.jupiter.api.Assertions.*;

import com.learnnow.admin.dto.request.ImportCourseRequest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.paths.service.CatalogService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
public class ContentAuthoringServiceTest extends com.learnnow.AbstractIntegrationTest {

    @Autowired private ContentAuthoringService authoringService;

    @Autowired private CatalogService catalogService;

    @Autowired private JdbcTemplate jdbc;

    @PersistenceContext private EntityManager entityManager;

    @Test
    @Transactional
    public void testSaveAndRetrieveMcqQuestions() {
        AdminPathDto.AdminQuizQuestionDto qDto =
                new AdminPathDto.AdminQuizQuestionDto(
                        null,
                        "mcq",
                        "Which HTTP method is idempotent?",
                        List.of("GET", "POST", "PATCH", "CONNECT"),
                        "GET",
                        "GET is idempotent.",
                        5);

        AdminPathDto.AdminSubtopicDto subDto =
                new AdminPathDto.AdminSubtopicDto(
                        null,
                        "HTTP Methods Subtopic",
                        "### Overview of HTTP Methods",
                        1,
                        "PUBLISHED",
                        "beginner",
                        "concept",
                        List.of(),
                        null,
                        5,
                        List.of(),
                        List.of(qDto));

        AdminPathDto.AdminTopicDto topicDto =
                new AdminPathDto.AdminTopicDto(
                        null,
                        "Networking Basics",
                        "Topic covering HTTP and TCP",
                        "Backend",
                        "1 hour",
                        1,
                        "PUBLISHED",
                        List.of(subDto));

        AdminPathDto pathDto =
                new AdminPathDto(
                        null,
                        "Backend Engineering Path",
                        "Complete guide to backend engineering",
                        "Backend",
                        "learnNow",
                        "PUBLISHED",
                        List.of(topicDto));

        // Save path
        AdminPathDto saved = authoringService.saveOrUpdatePath(pathDto);
        assertNotNull(saved.id());
        assertEquals(1, saved.topics().size());

        AdminPathDto.AdminTopicDto savedTopic = saved.topics().get(0);
        assertEquals(1, savedTopic.subtopics().size());

        AdminPathDto.AdminSubtopicDto savedSubtopic = savedTopic.subtopics().get(0);
        assertNotNull(savedSubtopic.questions());
        assertEquals(1, savedSubtopic.questions().size());
        assertEquals("Which HTTP method is idempotent?", savedSubtopic.questions().get(0).prompt());

        // Retrieve saved path by ID
        AdminPathDto fetched = authoringService.getAdminPathById(saved.id()).orElseThrow();
        AdminPathDto.AdminSubtopicDto fetchedSubtopic = fetched.topics().get(0).subtopics().get(0);
        assertNotNull(fetchedSubtopic.questions());
        assertEquals(1, fetchedSubtopic.questions().size());
        assertEquals(
                "Which HTTP method is idempotent?", fetchedSubtopic.questions().get(0).prompt());
    }

    @Test
    @Transactional
    public void testUpdateExistingPathAddAndModifyMcqs() {
        // Step 1: Create initial path without MCQs
        AdminPathDto.AdminSubtopicDto sub1 =
                new AdminPathDto.AdminSubtopicDto(
                        null,
                        "Subtopic 1",
                        "Content 1",
                        1,
                        "PUBLISHED",
                        "beginner",
                        "concept",
                        List.of(),
                        null,
                        5,
                        List.of(),
                        List.of());
        AdminPathDto.AdminTopicDto topic1 =
                new AdminPathDto.AdminTopicDto(
                        null,
                        "Topic 1",
                        "Desc 1",
                        "Backend",
                        "1 hour",
                        1,
                        "PUBLISHED",
                        List.of(sub1));
        AdminPathDto initialPath =
                new AdminPathDto(
                        null,
                        "Initial Path",
                        "Desc",
                        "Backend",
                        "learnNow",
                        "PUBLISHED",
                        List.of(topic1));

        AdminPathDto savedInitial = authoringService.saveOrUpdatePath(initialPath);
        assertNotNull(savedInitial.id());
        assertTrue(savedInitial.topics().get(0).subtopics().get(0).questions().isEmpty());

        // Step 2: Update existing path to ADD an MCQ question
        AdminPathDto.AdminQuizQuestionDto newMcq =
                new AdminPathDto.AdminQuizQuestionDto(
                        null, "mcq", "What is 2+2?", List.of("3", "4", "5"), "4", "2+2=4", 5);
        AdminPathDto.AdminSubtopicDto updatedSub1 =
                new AdminPathDto.AdminSubtopicDto(
                        savedInitial.topics().get(0).subtopics().get(0).id(),
                        "Subtopic 1",
                        "Content 1",
                        1,
                        "PUBLISHED",
                        "beginner",
                        "concept",
                        List.of(),
                        null,
                        5,
                        List.of(),
                        List.of(newMcq));
        AdminPathDto.AdminTopicDto updatedTopic1 =
                new AdminPathDto.AdminTopicDto(
                        savedInitial.topics().get(0).id(),
                        "Topic 1",
                        "Desc 1",
                        "Backend",
                        "1 hour",
                        1,
                        "PUBLISHED",
                        List.of(updatedSub1));
        AdminPathDto updatePayload =
                new AdminPathDto(
                        savedInitial.id(),
                        "Initial Path",
                        "Desc",
                        "Backend",
                        "learnNow",
                        "PUBLISHED",
                        List.of(updatedTopic1));

        AdminPathDto savedUpdate = authoringService.saveOrUpdatePath(updatePayload);
        assertEquals(savedInitial.id(), savedUpdate.id());
        assertNotNull(savedUpdate.topics().get(0).subtopics().get(0).questions());
        assertEquals(1, savedUpdate.topics().get(0).subtopics().get(0).questions().size());
        assertEquals(
                "What is 2+2?",
                savedUpdate.topics().get(0).subtopics().get(0).questions().get(0).prompt());

        // Step 3: Fetch again from DB
        AdminPathDto fetchedAgain =
                authoringService.getAdminPathById(savedInitial.id()).orElseThrow();
        assertEquals(1, fetchedAgain.topics().get(0).subtopics().get(0).questions().size());
        assertEquals(
                "What is 2+2?",
                fetchedAgain.topics().get(0).subtopics().get(0).questions().get(0).prompt());
    }

    /**
     * Re-importing a course with OVERWRITE sends each lesson's snippets again under the ids they
     * already have. The import built new entities for them alongside the managed ones, so Hibernate
     * held two objects with one key and refused the whole import - for any lesson with a snippet.
     */
    @Test
    @Transactional
    public void overwritingACourseUpdatesItsSnippetsInPlace() {
        authoringService.importCourse(courseWithSnippet("System.out.println(1);", "1\n"));
        entityManager.flush();

        authoringService.importCourse(courseWithSnippet("System.out.println(2);", "2\n"));
        entityManager.flush();

        assertEquals(
                List.of("System.out.println(2);"),
                jdbc.queryForList(
                        "SELECT s.code FROM subtopic_code_snippets s JOIN subtopics st ON"
                                + " st.id = s.subtopic_id WHERE st.title = 'Lesson with a snippet'",
                        String.class));
    }

    private static ImportCourseRequest courseWithSnippet(String code, String output) {
        var snippet =
                new ImportCourseRequest.ImportCodeSnippetRequest(
                        "lesson-with-a-snippet-snippet-1",
                        "java",
                        "Demo",
                        code,
                        output,
                        true,
                        true,
                        1);
        var question =
                new ImportCourseRequest.ImportQuestionRequest(
                        "mcq", "Pick one", List.of("a", "b"), "a", "Because.", 1);
        var lesson =
                new ImportCourseRequest.ImportSubtopicRequest(
                        "Lesson with a snippet",
                        "### Body",
                        "beginner",
                        "hands-on",
                        List.of(),
                        null,
                        5,
                        List.of(snippet),
                        List.of(question));
        return new ImportCourseRequest(
                null,
                "Course imported twice",
                "d",
                "Backend",
                "learnNow",
                "OVERWRITE",
                List.of(
                        new ImportCourseRequest.ImportTopicRequest(
                                "Only topic", "t", "Backend", "1 hour", List.of(lesson))));
    }

    /**
     * Deleting a path used to leave every one of its topics behind with no path, because
     * path_topics cascades from paths but topics do not. The fix must not overreach: a topic
     * another path uses has to survive, and so does a topic an admin unlinked to reuse later.
     */
    @Test
    @Transactional
    public void deletingAPathTakesOnlyItsOwnTopics() {
        AdminPathDto.AdminSubtopicDto lesson =
                new AdminPathDto.AdminSubtopicDto(
                        null,
                        "Owned lesson",
                        "### Body",
                        1,
                        "DRAFT",
                        "beginner",
                        "concept",
                        List.of(),
                        null,
                        5,
                        List.of(),
                        List.of());

        AdminPathDto doomed =
                authoringService.saveOrUpdatePath(
                        new AdminPathDto(
                                null,
                                "Path being deleted",
                                "d",
                                "Backend",
                                "learnNow",
                                "DRAFT",
                                List.of(
                                        topic("Owned topic", 1, List.of(lesson)),
                                        topic("Shared topic", 2, List.of()))));
        AdminPathDto keeper =
                authoringService.saveOrUpdatePath(
                        new AdminPathDto(
                                null,
                                "Path that stays",
                                "d",
                                "Backend",
                                "learnNow",
                                "DRAFT",
                                List.of()));
        AdminPathDto parking =
                authoringService.saveOrUpdatePath(
                        new AdminPathDto(
                                null,
                                "Path a topic is unlinked from",
                                "d",
                                "Backend",
                                "learnNow",
                                "DRAFT",
                                List.of(topic("Parked topic", 1, List.of()))));

        var owned = doomed.topics().get(0).id();
        var shared = doomed.topics().get(1).id();
        var parked = parking.topics().get(0).id();

        authoringService.attachTopicToPath(keeper.id(), shared, null);
        authoringService.unlinkTopicFromPath(parking.id(), parked);

        authoringService.deletePath(doomed.id());

        assertEquals(0, count("SELECT count(*) FROM paths WHERE id = ?", doomed.id()));
        assertEquals(0, count("SELECT count(*) FROM topics WHERE id = ?", owned));
        assertEquals(
                0,
                count("SELECT count(*) FROM subtopics WHERE topic_id = ?", owned),
                "the owned topic's lessons go with it");
        assertEquals(1, count("SELECT count(*) FROM topics WHERE id = ?", shared));
        assertEquals(
                1,
                count("SELECT count(*) FROM path_topics WHERE topic_id = ?", shared),
                "the shared topic stays attached to the other path");
        assertEquals(
                1,
                count("SELECT count(*) FROM topics WHERE id = ?", parked),
                "a deliberately unlinked topic is not swept up");
    }

    private static AdminPathDto.AdminTopicDto topic(
            String title, int order, List<AdminPathDto.AdminSubtopicDto> subtopics) {
        return new AdminPathDto.AdminTopicDto(
                null, title, "t", "course", "1 hour", order, "DRAFT", subtopics);
    }

    private int count(String sql, Object id) {
        return jdbc.queryForObject(sql, Integer.class, id);
    }
}
