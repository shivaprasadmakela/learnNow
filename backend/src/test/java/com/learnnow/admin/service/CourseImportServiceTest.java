package com.learnnow.admin.service;

import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.dto.request.ImportCourseRequest;
import com.learnnow.admin.dto.response.ImportResultDto;
import com.learnnow.common.exception.ValidationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
public class CourseImportServiceTest {

    @Autowired
    private ContentAuthoringService authoringService;

    @Autowired
    private com.learnnow.paths.repository.PathRepository pathRepository;

    private ImportCourseRequest.ImportTopicRequest makeTopic(String title, String description) {
        ImportCourseRequest.ImportSubtopicRequest sub = new ImportCourseRequest.ImportSubtopicRequest(
                title + " - Subtopic 1",
                "## Content for " + title,
                "beginner",
                "concept",
                List.of(),
                null,
                5,
                List.of(),
                List.of()
        );
        return new ImportCourseRequest.ImportTopicRequest(
                title, description, "course", "1 hour", List.of(sub)
        );
    }

    // ─── Test 1: Create new course ───────────────────────────────────────────────

    @Test
    @Transactional
    public void testBulkImportCourseToDraft() {
        ImportCourseRequest.ImportQuestionRequest question = new ImportCourseRequest.ImportQuestionRequest(
                "mcq",
                "Which pattern separates read and write models?",
                List.of("Event Sourcing", "CQRS", "Saga", "Circuit Breaker"),
                "CQRS",
                "CQRS stands for Command Query Responsibility Segregation.",
                5
        );

        ImportCourseRequest.ImportSubtopicRequest subtopic1 = new ImportCourseRequest.ImportSubtopicRequest(
                "Introduction to CQRS",
                "# CQRS Overview\n\nCommand Query Responsibility Segregation divides...",
                "beginner",
                "concept",
                List.of(),
                null,
                5,
                List.of(),
                List.of(question)
        );

        ImportCourseRequest.ImportSubtopicRequest subtopic2 = new ImportCourseRequest.ImportSubtopicRequest(
                "Event Sourcing Basics",
                "# Event Sourcing\n\nStoring changes as a sequence of events...",
                "beginner",
                "concept",
                List.of(),
                null,
                5,
                List.of(),
                List.of()
        );

        ImportCourseRequest.ImportTopicRequest topic1 = new ImportCourseRequest.ImportTopicRequest(
                "Advanced Architecture Patterns",
                "Deep dive into CQRS and Event Sourcing",
                "course",
                "2 hours",
                List.of(subtopic1, subtopic2)
        );

        // null pathId = CREATE mode
        ImportCourseRequest request = new ImportCourseRequest(
                null,
                "Distributed Systems Mastery",
                "Complete course on designing distributed systems",
                "Backend",
                "learnNow",
                "FAIL_ON_CONFLICT",
                List.of(topic1)
        );

        ImportResultDto result = authoringService.importCourse(request);

        assertNotNull(result);
        assertNotNull(result.pathId());
        assertEquals("Distributed Systems Mastery", result.pathTitle());
        assertEquals(1, result.topicsCreated());
        assertEquals(2, result.subtopicsCreated());
        assertEquals(1, result.questionsCreated());
        assertEquals("DRAFT", result.status());
        assertEquals("CREATED", result.mode());

        AdminPathDto fetched = authoringService.getAdminPathById(result.pathId()).orElseThrow();
        assertEquals("DRAFT", fetched.status());
        assertEquals(1, fetched.topics().size());

        AdminPathDto.AdminTopicDto topic = fetched.topics().get(0);
        assertEquals("Advanced Architecture Patterns", topic.title());
        assertEquals(1, topic.orderIndex());
        assertEquals(2, topic.subtopics().size());

        AdminPathDto.AdminSubtopicDto sub1 = topic.subtopics().get(0);
        assertEquals("Introduction to CQRS", sub1.title());
        assertEquals(1, sub1.orderIndex());
        assertEquals(1, sub1.questions().size());
        assertEquals("Which pattern separates read and write models?", sub1.questions().get(0).prompt());

        AdminPathDto.AdminSubtopicDto sub2 = topic.subtopics().get(1);
        assertEquals("Event Sourcing Basics", sub2.title());
        assertEquals(2, sub2.orderIndex());
        assertTrue(sub2.questions().isEmpty());
    }

    // ─── Test 2: Append topics to existing course ─────────────────────────────────

    @Test
    @Transactional
    public void testBulkAppendTopicsToExistingCourse() {
        // Step 1: Create a base course with 2 topics
        ImportCourseRequest createRequest = new ImportCourseRequest(
                null,
                "Java Masterclass",
                "Complete Java course",
                "Backend",
                "learnNow",
                "FAIL_ON_CONFLICT",
                List.of(
                        makeTopic("Topic 1: Java Basics", "Fundamentals of Java"),
                        makeTopic("Topic 2: OOP", "Object-Oriented Programming")
                )
        );
        ImportResultDto created = authoringService.importCourse(createRequest);
        assertNotNull(created.pathId());
        assertEquals("CREATED", created.mode());
        assertEquals(2, created.topicsCreated());

        // Verify initial orderIndex values
        AdminPathDto afterCreate = authoringService.getAdminPathById(created.pathId()).orElseThrow();
        assertEquals(1, afterCreate.topics().get(0).orderIndex());
        assertEquals(2, afterCreate.topics().get(1).orderIndex());

        // Step 2: Append 2 more topics to the same path
        ImportCourseRequest appendRequest = new ImportCourseRequest(
                created.pathId(),  // APPEND mode
                null,
                null,
                null,
                null,
                "FAIL_ON_CONFLICT",
                List.of(
                        makeTopic("Topic 3: Collections", "Java Collections Framework"),
                        makeTopic("Topic 4: Streams", "Java Streams API")
                )
        );
        ImportResultDto appended = authoringService.importCourse(appendRequest);

        assertEquals(created.pathId(), appended.pathId());
        assertEquals("Java Masterclass", appended.pathTitle());
        assertEquals("APPENDED", appended.mode());
        assertEquals(2, appended.topicsCreated());

        // Verify appended topics have orderIndex continuation (3, 4)
        AdminPathDto afterAppend = authoringService.getAdminPathById(created.pathId()).orElseThrow();
        assertEquals(4, afterAppend.topics().size());

        // First 2 topics unchanged
        assertEquals("Topic 1: Java Basics", afterAppend.topics().get(0).title());
        assertEquals(1, afterAppend.topics().get(0).orderIndex());
        assertEquals("Topic 2: OOP", afterAppend.topics().get(1).title());
        assertEquals(2, afterAppend.topics().get(1).orderIndex());

        // New topics start at orderIndex 3
        assertEquals("Topic 3: Collections", afterAppend.topics().get(2).title());
        assertEquals(3, afterAppend.topics().get(2).orderIndex());
        assertEquals("Topic 4: Streams", afterAppend.topics().get(3).title());
        assertEquals(4, afterAppend.topics().get(3).orderIndex());
    }

    // ─── Test 3: Create mode without title should fail ────────────────────────────

    @Test
    @Transactional
    public void testCreateModeRequiresTitleAndDescription() {
        ImportCourseRequest badRequest = new ImportCourseRequest(
                null, // no pathId = CREATE mode
                null, // missing title
                null, // missing description
                "Backend",
                "learnNow",
                "FAIL_ON_CONFLICT",
                List.of(makeTopic("Some Topic", "Desc"))
        );

        assertThrows(ValidationException.class, () -> authoringService.importCourse(badRequest));
    }

    // ─── Test 4: Conflict detection and resolution strategies ────────────────────────

    @Test
    @Transactional
    public void testConflictValidationAndStrategyExecution() {
        // Step 1: Initial import
        ImportCourseRequest initialReq = new ImportCourseRequest(
                null,
                "Microservices System Design",
                "Learn microservices architecture",
                "Backend",
                "learnNow",
                "FAIL_ON_CONFLICT",
                List.of(makeTopic("API Gateway Pattern", "Overview of API Gateways"))
        );
        ImportResultDto initialResult = authoringService.importCourse(initialReq);

        // Step 2: Validate collision dry-run
        ImportCourseRequest duplicateReq = new ImportCourseRequest(
                null,
                "Microservices System Design",
                "New description",
                "Backend",
                "learnNow",
                "FAIL_ON_CONFLICT",
                List.of(makeTopic("API Gateway Pattern", "New topic content"))
        );

        com.learnnow.admin.dto.response.ImportValidationResultDto validation = authoringService.validateImportConflicts(duplicateReq);
        assertTrue(validation.hasConflicts());
        assertEquals(1, validation.conflicts().size());
        assertEquals("PATH", validation.conflicts().get(0).level());
        assertEquals("Microservices System Design", validation.conflicts().get(0).entityName());

        // Step 3: Default FAIL_ON_CONFLICT strategy throws ConflictException
        assertThrows(com.learnnow.common.exception.ConflictException.class, () -> authoringService.importCourse(duplicateReq));

        // Step 4: Test OVERWRITE strategy
        ImportCourseRequest overwriteReq = new ImportCourseRequest(
                null,
                "Microservices System Design",
                "Updated description",
                "Backend",
                "learnNow",
                "OVERWRITE",
                List.of(makeTopic("API Gateway Pattern", "Updated Gateway content"))
        );

        ImportResultDto overwriteResult = authoringService.importCourse(overwriteReq);
        assertEquals(initialResult.pathId(), overwriteResult.pathId());

        AdminPathDto updatedPath = authoringService.getAdminPathById(initialResult.pathId()).orElseThrow();
        assertEquals("Updated description", updatedPath.description());
    }

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Test
    @Transactional
    public void testImportFrontendDeveloperProductionJson() throws Exception {
        java.io.File file = new java.io.File("/Users/shivaprasad/Downloads/frontend-developer-production.json");
        if (!file.exists()) return;
        pathRepository.findAll().stream()
                .filter(p -> "Frontend Developer".equalsIgnoreCase(p.getTitle()))
                .forEach(pathRepository::delete);
        String json = new String(java.nio.file.Files.readAllBytes(file.toPath()));
        ImportCourseRequest request = objectMapper.readValue(json, ImportCourseRequest.class);
        ImportResultDto result = authoringService.importCourse(request);
        assertNotNull(result);
        assertEquals("Frontend Developer", result.pathTitle());
        assertEquals(27, result.topicsCreated());
        assertTrue(result.subtopicsCreated() > 50);
    }
}
