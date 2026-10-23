package com.learnnow.dsa.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.compiler.dto.request.ExecuteCodeRequest;
import com.learnnow.compiler.dto.response.ExecuteCodeResponse;
import com.learnnow.compiler.service.CompilerSnippetService;
import com.learnnow.dsa.dto.request.DsaCheckAnswerRequest;
import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.dto.request.DsaRunRequest;
import com.learnnow.dsa.dto.request.DsaSubmitRequest;
import com.learnnow.dsa.dto.response.DsaCheckAnswerDto;
import com.learnnow.dsa.dto.response.DsaEditorialDto;
import com.learnnow.dsa.dto.response.DsaProblemDetailDto;
import com.learnnow.dsa.dto.response.DsaProblemRowDto;
import com.learnnow.dsa.dto.response.DsaRunResultDto;
import com.learnnow.dsa.dto.response.DsaSubmitResultDto;
import com.learnnow.dsa.entity.DsaProgressStatus;
import com.learnnow.dsa.repository.DsaCheckRepository;
import com.learnnow.dsa.repository.DsaProblemRepository;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.notes.entity.NoteTarget;
import com.learnnow.notes.service.NotesService;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageRequest;

/**
 * What a learner's browser is sent, and what a replayed request can earn.
 *
 * <p>Each test here pins one hole that was open: an inline check that paid out on every correct
 * submission, hints and the whole editorial shipped with the statement, a hidden test case's input
 * readable through the stderr of a crashed Submit, and a sheet search that fanned out to every
 * step. The execution engine is mocked - these are about what comes back, not about running code -
 * which also means this class gets an application context of its own.
 */
@SpringBootTest
class DsaLearnerExposureIntegrationTest extends com.learnnow.AbstractIntegrationTest {

    private static final String SHEET = "exposure-sheet";
    private static final String DRIVER = "int main(){ {{USER_CODE}} return 0; }";
    private static final String HIDDEN_INPUT = "SECRET-HIDDEN-INPUT";
    private static final String BRUTE_INTUITION = "Sort and take the last element.";
    private static final String OPTIMAL_CODE = "class Solution { /* optimal-java */ }";

    @MockBean private CompilerSnippetService compilerSnippetService;

    @Autowired private DsaImportService importService;
    @Autowired private DsaCatalogService catalogService;
    @Autowired private DsaSubmissionService submissionService;
    @Autowired private DsaProgressService progressService;
    @Autowired private DsaProblemRepository problemRepository;
    @Autowired private DsaCheckRepository checkRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserLearningPreferencesRepository preferencesRepository;
    @Autowired private NotesService notesService;
    @Autowired private ObjectMapper objectMapper;

    private String userId;
    private UUID maxId;
    private UUID sumId;
    private UUID draftId;

    @BeforeEach
    void seed() {
        importService.importContent(
                new DsaImportRequest(
                        SHEET,
                        "Exposure sheet",
                        null,
                        null,
                        List.of(
                                new DsaImportRequest.ImportStep(
                                        "exposure-step",
                                        1,
                                        "Exposure step",
                                        null,
                                        List.of(
                                                new DsaImportRequest.ImportSection(
                                                        "Arrays",
                                                        null,
                                                        1,
                                                        List.of(
                                                                maxProblem(),
                                                                sumProblem(),
                                                                draftProblem()),
                                                        null))))));

        maxId = problemRepository.findBySlug("exposure-max").orElseThrow().getId();
        sumId = problemRepository.findBySlug("exposure-sum").orElseThrow().getId();
        draftId = problemRepository.findBySlug("exposure-draft").orElseThrow().getId();

        // A fresh learner per test, so attempts and points never carry over between tests.
        userId = "exposure-" + UUID.randomUUID();
        userRepository.save(
                User.builder()
                        .id(userId)
                        .email(userId + "@example.com")
                        .passwordHash("hashedpass")
                        .fullName("Exposure Tester")
                        .build());
    }

    private DsaImportRequest.ImportProblem maxProblem() {
        return new DsaImportRequest.ImportProblem(
                "exposure-max",
                "Maximum element",
                "Find the largest element.",
                "EASY",
                List.of("array", "greedy"),
                10,
                null,
                null,
                null,
                null,
                "PUBLISHED",
                List.of("first hint", "second hint"),
                new DsaImportRequest.ImportCheck(
                        "Which option?", List.of("A", "B", "C"), "B", "Because B.", 3),
                List.of(
                        new DsaImportRequest.ImportApproach(
                                "BRUTE",
                                BRUTE_INTUITION,
                                "O(n log n)",
                                "O(n)",
                                Map.of("java", "class Solution { /* brute-java */ }"),
                                null,
                                null),
                        new DsaImportRequest.ImportApproach(
                                "OPTIMAL",
                                "Keep the best value seen so far.",
                                "O(n)",
                                "O(1)",
                                Map.of("java", OPTIMAL_CODE),
                                null,
                                null)),
                Map.of("cpp", new DsaImportRequest.ImportHarness("// starter", DRIVER, null)),
                List.of(
                        new DsaImportRequest.ImportTestCase("1 2", "2", true, null),
                        new DsaImportRequest.ImportTestCase(HIDDEN_INPUT, "9", false, null)));
    }

    private DsaImportRequest.ImportProblem sumProblem() {
        return new DsaImportRequest.ImportProblem(
                "exposure-sum",
                "Sum of digits",
                "Add the digits.",
                "MEDIUM",
                List.of("math"),
                10,
                null,
                null,
                null,
                null,
                "PUBLISHED",
                null,
                null,
                null,
                null,
                null);
    }

    private DsaImportRequest.ImportProblem draftProblem() {
        return new DsaImportRequest.ImportProblem(
                "exposure-draft",
                "Draft maximum",
                "Not yet.",
                "EASY",
                List.of("greedy"),
                10,
                null,
                null,
                null,
                null,
                "DRAFT",
                List.of("draft hint"),
                new DsaImportRequest.ImportCheck("Draft?", List.of("X", "Y"), "X", null, 3),
                List.of(
                        new DsaImportRequest.ImportApproach(
                                "OPTIMAL", "Draft intuition", "O(1)", "O(1)", null, null, null)),
                null,
                null);
    }

    private UUID checkOf(UUID problemId) {
        return checkRepository.findByProblemIdOrderByOrderIndexAsc(problemId).get(0).getId();
    }

    private int totalPoints() {
        return preferencesRepository
                .findByUserId(userId)
                .map(UserLearningPreferences::getTotalPoints)
                .orElse(0);
    }

    private DsaCheckAnswerDto answer(UUID checkId, String option) {
        return submissionService.answerCheck(userId, checkId, new DsaCheckAnswerRequest(option));
    }

    // ------------------------------------------------------------------ inline check

    @Test
    void aWrongFirstAnswerScoresNothingAndTheRightOneAfterItScoresNothingEither() {
        UUID check = checkOf(maxId);

        DsaCheckAnswerDto wrong = answer(check, "A");
        assertThat(wrong.correct()).isFalse();
        assertThat(wrong.pointsAwarded()).isZero();
        assertThat(wrong.alreadyAttempted()).isFalse();
        // Revealed even though it was wrong: the attempt is spent, so there is nothing to farm.
        assertThat(wrong.correctAnswer()).isEqualTo("B");
        assertThat(wrong.explanation()).isEqualTo("Because B.");

        DsaCheckAnswerDto replay = answer(check, "B");
        assertThat(replay.correct()).isTrue();
        assertThat(replay.pointsAwarded()).isZero();
        assertThat(replay.alreadyAttempted()).isTrue();

        assertThat(totalPoints()).isZero();
    }

    @Test
    void aCorrectFirstAnswerScoresOnceAndReplayingItEarnsNothing() {
        UUID check = checkOf(maxId);

        DsaCheckAnswerDto first = answer(check, " b ");
        assertThat(first.correct()).isTrue();
        assertThat(first.pointsAwarded()).isEqualTo(3);
        assertThat(first.alreadyAttempted()).isFalse();

        for (int i = 0; i < 3; i++) {
            DsaCheckAnswerDto again = answer(check, "B");
            assertThat(again.pointsAwarded()).isZero();
            assertThat(again.alreadyAttempted()).isTrue();
        }

        assertThat(totalPoints()).isEqualTo(3);
    }

    @Test
    void aCheckOnAnUnpublishedProblemCannotBeAnswered() {
        UUID check = checkOf(draftId);

        assertThatThrownBy(() -> answer(check, "X")).isInstanceOf(NotFoundException.class);
        assertThat(totalPoints()).isZero();
    }

    // ------------------------------------------------------------------ hints and editorial

    @Test
    void theProblemPayloadCarriesOnlyTheOutlineOfTheHintsAndTheEditorial() throws Exception {
        DsaProblemDetailDto detail = catalogService.problemById(maxId, userId);

        assertThat(detail.hintCount()).isEqualTo(2);
        assertThat(detail.approaches())
                .extracting(a -> a.kind() + " " + a.timeComplexity())
                .containsExactly("BRUTE O(n log n)", "OPTIMAL O(n)");

        // Whatever the DTO looks like, none of the text may be in what is serialised.
        String json = objectMapper.writeValueAsString(detail);
        assertThat(json)
                .doesNotContain("first hint")
                .doesNotContain("second hint")
                .doesNotContain(BRUTE_INTUITION)
                .doesNotContain("optimal-java")
                .doesNotContain(HIDDEN_INPUT)
                .doesNotContain("Because B.");
    }

    @Test
    void hintsAreServedOneAtATimeCountingFromOne() {
        assertThat(catalogService.hint(maxId, 1).body()).isEqualTo("first hint");
        assertThat(catalogService.hint(maxId, 2).body()).isEqualTo("second hint");

        assertThatThrownBy(() -> catalogService.hint(maxId, 3))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> catalogService.hint(maxId, 0))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void theEditorialCarriesTheReasoningAndTheCode() {
        DsaEditorialDto editorial = catalogService.editorial(maxId);

        assertThat(editorial.approaches()).hasSize(2);
        assertThat(editorial.approaches().get(0).intuition()).isEqualTo(BRUTE_INTUITION);
        assertThat(editorial.approaches().get(1).solutions())
                .singleElement()
                .satisfies(s -> assertThat(s.code()).isEqualTo(OPTIMAL_CODE));
    }

    @Test
    void aDraftsHintsAndEditorialReachOnlyThePreview() {
        assertThatThrownBy(() -> catalogService.hint(draftId, 1))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> catalogService.editorial(draftId))
                .isInstanceOf(NotFoundException.class);

        assertThat(catalogService.previewHint(draftId, 1).body()).isEqualTo("draft hint");
        assertThat(catalogService.previewEditorial(draftId).approaches()).hasSize(1);
    }

    @Test
    void theProblemSaysWhetherThisLearnerBookmarkedIt() {
        assertThat(catalogService.problemById(maxId, userId).bookmarked()).isFalse();

        notesService.toggleBookmark(userId, NoteTarget.DSA_PROBLEM, maxId);

        assertThat(catalogService.problemById(maxId, userId).bookmarked()).isTrue();
        assertThat(catalogService.problemById(maxId, null).bookmarked()).isFalse();
    }

    // ------------------------------------------------------------------ hidden cases

    @Test
    void aCrashOnAHiddenCaseDoesNotHandOverWhatTheCodePrinted() {
        // The learner's code reads stdin and echoes it to stderr before throwing - the exploit.
        when(compilerSnippetService.executeCode(any()))
                .thenAnswer(
                        invocation -> {
                            ExecuteCodeRequest request = invocation.getArgument(0);
                            if (request.getStdin().contains(HIDDEN_INPUT)) {
                                return ExecuteCodeResponse.builder()
                                        .statusCode(11)
                                        .stderr("Exception: " + request.getStdin())
                                        .stdout(request.getStdin())
                                        .build();
                            }
                            return ExecuteCodeResponse.builder()
                                    .statusCode(3)
                                    .stdout("2\n" + DsaExecutionService.CASE_DELIMITER + "\n")
                                    .build();
                        });

        DsaSubmitResultDto result =
                submissionService.submit(
                        userId, maxId, new DsaSubmitRequest("cpp", "class Solution {};"));

        assertThat(result.verdict()).isEqualTo("RUNTIME_ERROR");
        assertThat(result.stderr()).isEqualTo(DsaExecutionService.HIDDEN_CASE_STDERR);
        assertThat(result.cases())
                .allSatisfy(c -> assertThat(c.input()).isNotEqualTo(HIDDEN_INPUT));
        assertThat(result.cases().get(0).actualOutput()).doesNotContain(HIDDEN_INPUT);

        // The sample never shared a stdin with the hidden case, so it could not have read it.
        ArgumentCaptor<ExecuteCodeRequest> sent = ArgumentCaptor.forClass(ExecuteCodeRequest.class);
        verify(compilerSnippetService, atLeastOnce()).executeCode(sent.capture());
        assertThat(sent.getAllValues())
                .noneSatisfy(r -> assertThat(r.getStdin()).contains("1 2").contains(HIDDEN_INPUT));
    }

    @Test
    void aCrashOnASampleKeepsItsStderr() {
        when(compilerSnippetService.executeCode(any()))
                .thenReturn(
                        ExecuteCodeResponse.builder()
                                .statusCode(11)
                                .stderr("Segmentation fault near the sample")
                                .build());

        DsaSubmitResultDto submit =
                submissionService.submit(
                        userId, maxId, new DsaSubmitRequest("cpp", "class Solution {};"));
        assertThat(submit.stderr()).contains("Segmentation fault");

        DsaRunResultDto run =
                submissionService.run(
                        userId, maxId, new DsaRunRequest("cpp", "class Solution {};", null));
        assertThat(run.stderr()).contains("Segmentation fault");
    }

    // ------------------------------------------------------------------ sheet search

    private List<String> searchSlugs(String userId, String q, String difficulty, String status) {
        return catalogService
                .searchSheet(SHEET, userId, q, difficulty, status, PageRequest.of(0, 50))
                .content()
                .stream()
                .map(DsaProblemRowDto::slug)
                .toList();
    }

    @Test
    void searchesTheWholeSheetByTitleTagDifficultyAndStatus() {
        // A tag match, and never a draft even when it matches.
        assertThat(searchSlugs(userId, "GREEDY", null, null)).containsExactly("exposure-max");
        assertThat(searchSlugs(userId, "digits", null, null)).containsExactly("exposure-sum");
        assertThat(searchSlugs(userId, null, "MEDIUM", "ALL")).containsExactly("exposure-sum");
        // The learner's own wildcard characters are literal.
        assertThat(searchSlugs(userId, "%", null, null)).isEmpty();

        progressService.setStatus(userId, sumId, DsaProgressStatus.SOLVED, null);
        assertThat(searchSlugs(userId, null, null, "SOLVED")).containsExactly("exposure-sum");
        assertThat(searchSlugs(userId, null, null, "TODO")).containsExactly("exposure-max");
        assertThat(searchSlugs(null, null, null, "SOLVED")).isEmpty();

        notesService.toggleBookmark(userId, NoteTarget.DSA_PROBLEM, maxId);
        assertThat(searchSlugs(userId, null, null, "BOOKMARKED")).containsExactly("exposure-max");
    }

    @Test
    void searchResultsArePagedRowsThatKnowTheirStep() {
        PageResponse<DsaProblemRowDto> first =
                catalogService.searchSheet(SHEET, userId, null, null, null, PageRequest.of(0, 1));

        assertThat(first.totalElements()).isEqualTo(2);
        assertThat(first.hasNext()).isTrue();
        assertThat(first.content())
                .singleElement()
                .satisfies(
                        row -> {
                            assertThat(row.slug()).isEqualTo("exposure-max");
                            assertThat(row.stepId()).isNotNull();
                        });

        assertThat(
                        catalogService
                                .searchSheet(SHEET, userId, null, null, null, PageRequest.of(1, 1))
                                .content())
                .extracting(DsaProblemRowDto::slug)
                .containsExactly("exposure-sum");

        assertThatThrownBy(() -> searchSlugs(userId, null, null, "WHATEVER"))
                .isInstanceOf(ValidationException.class);
    }
}
