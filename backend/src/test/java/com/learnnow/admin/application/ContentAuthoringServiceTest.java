package com.learnnow.admin.application;

import com.learnnow.admin.api.dto.AdminPathDto;
import com.learnnow.paths.service.CatalogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
public class ContentAuthoringServiceTest {

    @Autowired
    private ContentAuthoringService authoringService;

    @Autowired
    private CatalogService catalogService;

    @Test
    @Transactional
    public void testSaveAndRetrieveMcqQuestions() {
        AdminPathDto.AdminQuizQuestionDto qDto = new AdminPathDto.AdminQuizQuestionDto(
                null,
                "mcq",
                "Which HTTP method is idempotent?",
                List.of("GET", "POST", "PATCH", "CONNECT"),
                "GET",
                "GET is idempotent.",
                5
        );

        AdminPathDto.AdminSubtopicDto subDto = new AdminPathDto.AdminSubtopicDto(
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
                List.of(qDto)
        );

        AdminPathDto.AdminTopicDto topicDto = new AdminPathDto.AdminTopicDto(
                null,
                "Networking Basics",
                "Topic covering HTTP and TCP",
                "Backend",
                "1 hour",
                1,
                "PUBLISHED",
                List.of(subDto)
        );

        AdminPathDto pathDto = new AdminPathDto(
                null,
                "Backend Engineering Path",
                "Complete guide to backend engineering",
                "Backend",
                "learnNow",
                "PUBLISHED",
                List.of(topicDto)
        );

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
        assertEquals("Which HTTP method is idempotent?", fetchedSubtopic.questions().get(0).prompt());
    }

    @Test
    @Transactional
    public void testUpdateExistingPathAddAndModifyMcqs() {
        // Step 1: Create initial path without MCQs
        AdminPathDto.AdminSubtopicDto sub1 = new AdminPathDto.AdminSubtopicDto(
                null, "Subtopic 1", "Content 1", 1, "PUBLISHED", "beginner", "concept", List.of(), null, 5, List.of(), List.of()
        );
        AdminPathDto.AdminTopicDto topic1 = new AdminPathDto.AdminTopicDto(
                null, "Topic 1", "Desc 1", "Backend", "1 hour", 1, "PUBLISHED", List.of(sub1)
        );
        AdminPathDto initialPath = new AdminPathDto(
                null, "Initial Path", "Desc", "Backend", "learnNow", "PUBLISHED", List.of(topic1)
        );

        AdminPathDto savedInitial = authoringService.saveOrUpdatePath(initialPath);
        assertNotNull(savedInitial.id());
        assertTrue(savedInitial.topics().get(0).subtopics().get(0).questions().isEmpty());

        // Step 2: Update existing path to ADD an MCQ question
        AdminPathDto.AdminQuizQuestionDto newMcq = new AdminPathDto.AdminQuizQuestionDto(
                null, "mcq", "What is 2+2?", List.of("3", "4", "5"), "4", "2+2=4", 5
        );
        AdminPathDto.AdminSubtopicDto updatedSub1 = new AdminPathDto.AdminSubtopicDto(
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
                List.of(newMcq)
        );
        AdminPathDto.AdminTopicDto updatedTopic1 = new AdminPathDto.AdminTopicDto(
                savedInitial.topics().get(0).id(),
                "Topic 1",
                "Desc 1",
                "Backend",
                "1 hour",
                1,
                "PUBLISHED",
                List.of(updatedSub1)
        );
        AdminPathDto updatePayload = new AdminPathDto(
                savedInitial.id(),
                "Initial Path",
                "Desc",
                "Backend",
                "learnNow",
                "PUBLISHED",
                List.of(updatedTopic1)
        );

        AdminPathDto savedUpdate = authoringService.saveOrUpdatePath(updatePayload);
        assertEquals(savedInitial.id(), savedUpdate.id());
        assertNotNull(savedUpdate.topics().get(0).subtopics().get(0).questions());
        assertEquals(1, savedUpdate.topics().get(0).subtopics().get(0).questions().size());
        assertEquals("What is 2+2?", savedUpdate.topics().get(0).subtopics().get(0).questions().get(0).prompt());

        // Step 3: Fetch again from DB
        AdminPathDto fetchedAgain = authoringService.getAdminPathById(savedInitial.id()).orElseThrow();
        assertEquals(1, fetchedAgain.topics().get(0).subtopics().get(0).questions().size());
        assertEquals("What is 2+2?", fetchedAgain.topics().get(0).subtopics().get(0).questions().get(0).prompt());
    }
}
