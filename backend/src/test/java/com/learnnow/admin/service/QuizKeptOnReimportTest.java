package com.learnnow.admin.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.admin.dto.request.ImportCourseRequest;
import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.dto.response.ImportResultDto;
import com.learnnow.learningprogress.entity.UserQuizAttempt;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Re-importing a course with OVERWRITE used to delete every quiz question and create it again under
 * a new id. A learner's answers reference the question id with ON DELETE CASCADE, so each content
 * update erased quiz history and let every question score a second time.
 */
@SpringBootTest
@Transactional
class QuizKeptOnReimportTest extends AbstractIntegrationTest {

    private static final String USER = "quiz-reimport-user";

    @Autowired private ContentAuthoringService authoring;
    @Autowired private UserQuizAttemptRepository attempts;
    @Autowired private UserRepository users;
    @Autowired private PathRepository paths;
    @PersistenceContext private EntityManager em;

    @Test
    void anOverwriteKeepsQuestionIdsAndTheAnswersRecordedAgainstThem() {
        String title = "Reimport " + UUID.randomUUID();
        authoring.importCourse(
                course(title, List.of(question("How fast is a lookup?"), question("Why hash?"))));
        List<AdminPathDto.AdminQuizQuestionDto> before = questions(title);
        createUser();
        attempts.save(
                UserQuizAttempt.builder()
                        .userId(USER)
                        .questionId(before.get(0).id())
                        .correct(true)
                        .pointsAwarded(5)
                        .build());
        em.flush();
        em.clear();

        // The first prompt is unchanged, the second reworded, and a third is new.
        ImportResultDto again =
                authoring.importCourse(
                        course(
                                title,
                                List.of(
                                        question("How fast is a lookup?"),
                                        question("Why hash the key?"),
                                        question("What is a collision?"))));
        em.flush();
        em.clear();

        List<AdminPathDto.AdminQuizQuestionDto> after = questions(title);
        assertThat(after)
                .extracting(AdminPathDto.AdminQuizQuestionDto::prompt)
                .containsExactly(
                        "How fast is a lookup?", "Why hash the key?", "What is a collision?");
        assertThat(after.get(0).id()).isEqualTo(before.get(0).id());
        assertThat(after.get(1).id()).isEqualTo(before.get(1).id());
        assertThat(again.questionsCreated()).isEqualTo(1);
        assertThat(attempts.findByUserIdAndQuestionId(USER, before.get(0).id())).isPresent();
    }

    @Test
    void aQuestionTheImportNoLongerHasIsRemoved() {
        String title = "Reimport " + UUID.randomUUID();
        authoring.importCourse(course(title, List.of(question("Kept"), question("Dropped"))));
        em.flush();
        em.clear();

        authoring.importCourse(course(title, List.of(question("Kept"))));
        em.flush();
        em.clear();

        assertThat(questions(title))
                .extracting(AdminPathDto.AdminQuizQuestionDto::prompt)
                .containsExactly("Kept");
    }

    private List<AdminPathDto.AdminQuizQuestionDto> questions(String title) {
        UUID pathId = paths.findByTitleIgnoreCase(title).orElseThrow().getId();
        return authoring
                .getAdminPathById(pathId)
                .orElseThrow()
                .topics()
                .get(0)
                .subtopics()
                .get(0)
                .questions();
    }

    private static ImportCourseRequest.ImportQuestionRequest question(String prompt) {
        return new ImportCourseRequest.ImportQuestionRequest(
                "mcq", prompt, List.of("A", "B"), "A", "Because A.", 5);
    }

    private static ImportCourseRequest course(
            String title, List<ImportCourseRequest.ImportQuestionRequest> questions) {
        ImportCourseRequest.ImportSubtopicRequest lesson =
                new ImportCourseRequest.ImportSubtopicRequest(
                        "Maps",
                        "### How a map works",
                        "beginner",
                        "concept",
                        List.of(),
                        null,
                        5,
                        List.of(),
                        questions);
        return new ImportCourseRequest(
                null,
                title,
                "d",
                "Backend",
                "learnNow",
                "OVERWRITE",
                List.of(
                        new ImportCourseRequest.ImportTopicRequest(
                                "Collections", "t", "course", "1 hour", List.of(lesson))));
    }

    private void createUser() {
        if (users.findById(USER).isEmpty()) {
            users.save(
                    User.builder()
                            .id(USER)
                            .email("quiz_reimport@example.com")
                            .passwordHash("hashedpass")
                            .fullName("Reimport Tester")
                            .build());
        }
    }
}
