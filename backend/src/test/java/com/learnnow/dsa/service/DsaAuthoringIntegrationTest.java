package com.learnnow.dsa.service;

import static org.junit.jupiter.api.Assertions.*;

import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.dto.request.DsaProblemUpdateRequest;
import com.learnnow.dsa.dto.request.DsaSectionUpdateRequest;
import com.learnnow.dsa.dto.response.AdminDsaProblemDto;
import com.learnnow.dsa.dto.response.AdminDsaSheetDto;
import com.learnnow.dsa.dto.response.DsaProblemDetailDto;
import com.learnnow.dsa.repository.DsaProblemRepository;
import com.learnnow.dsa.repository.DsaSectionRepository;
import com.learnnow.dsa.repository.DsaTestCaseRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * The authoring writes, against a real Postgres.
 *
 * <p>These exercise the parts that a unit test with a mocked repository cannot see: the unique
 * indexes on {@code (problem_id, order_index)} that the replace-then-insert helpers have to flush
 * around, and the {@code ON DELETE CASCADE} chain that a section delete relies on. Both have
 * already produced a production bug in this module once.
 */
@SpringBootTest
class DsaAuthoringIntegrationTest extends com.learnnow.AbstractIntegrationTest {

    @Autowired private DsaImportService importService;
    @Autowired private DsaAuthoringService authoringService;
    @Autowired private DsaCatalogService catalogService;
    @Autowired private DsaSectionRepository sectionRepository;
    @Autowired private DsaProblemRepository problemRepository;
    @Autowired private DsaTestCaseRepository testCaseRepository;

    private static final String DRIVER = "int main(){ {{USER_CODE}} return 0; }";

    private UUID problemId;
    private UUID sheetId;

    @BeforeEach
    void seed() {
        importService.importContent(
                new DsaImportRequest(
                        "authoring-test-sheet",
                        "Authoring test",
                        null,
                        null,
                        List.of(
                                new DsaImportRequest.ImportStep(
                                        "step-one",
                                        1,
                                        "Step one",
                                        null,
                                        List.of(
                                                new DsaImportRequest.ImportSection(
                                                        "Basics",
                                                        null,
                                                        1,
                                                        List.of(problemJson("alpha")),
                                                        List.of(
                                                                new DsaImportRequest.ImportSection(
                                                                        "Nested",
                                                                        null,
                                                                        1,
                                                                        List.of(
                                                                                problemJson(
                                                                                        "beta")),
                                                                        null))))))));

        problemId = problemRepository.findBySlug("alpha").orElseThrow().getId();
        sheetId =
                authoringService
                        .listSheets(org.springframework.data.domain.Pageable.ofSize(10))
                        .content()
                        .stream()
                        .filter(s -> s.slug().equals("authoring-test-sheet"))
                        .findFirst()
                        .orElseThrow()
                        .id();
    }

    private DsaImportRequest.ImportProblem problemJson(String slug) {
        return new DsaImportRequest.ImportProblem(
                slug,
                "Problem " + slug,
                "Original statement",
                "EASY",
                List.of("array"),
                10,
                null,
                null,
                null,
                null,
                "DRAFT",
                List.of("first hint", "second hint"),
                null,
                null,
                Map.of("cpp", new DsaImportRequest.ImportHarness("// starter", DRIVER, null)),
                List.of(
                        new DsaImportRequest.ImportTestCase("1 2", "3", true, null),
                        new DsaImportRequest.ImportTestCase("4 5", "9", false, null)));
    }

    private DsaProblemUpdateRequest update(
            List<String> hints,
            List<DsaProblemUpdateRequest.TestCaseUpdate> cases,
            List<DsaProblemUpdateRequest.HarnessUpdate> harnesses) {
        return new DsaProblemUpdateRequest(
                "Renamed problem",
                "A rewritten statement",
                "HARD",
                List.of("graph", "bfs"),
                25,
                "https://example.test/video",
                3,
                null,
                null,
                "PUBLISHED",
                hints,
                null,
                cases,
                null,
                harnesses);
    }

    @Test
    void rewritesScalarFieldsAndReplacesHints() {
        AdminDsaProblemDto saved =
                authoringService.updateProblem(problemId, update(List.of("only hint"), null, null));

        assertEquals("Renamed problem", saved.title());
        assertEquals("HARD", saved.difficulty());
        assertEquals(List.of("graph", "bfs"), saved.tags());
        assertEquals(25, saved.estimatedMinutes());
        assertEquals("PUBLISHED", saved.status());
        assertEquals(1, saved.hints().size());
        assertEquals("only hint", saved.hints().get(0).body());
        assertEquals(1, saved.hints().get(0).orderIndex());
    }

    /**
     * The replace helpers delete then insert against a unique index on {@code (problem_id,
     * order_index)}. Hibernate orders inserts before deletes, so without an explicit flush this
     * throws a constraint violation on the second save rather than on the first.
     */
    @Test
    void survivesRepeatedSavesOfTheSameCollections() {
        authoringService.updateProblem(problemId, update(List.of("a", "b", "c"), null, null));

        assertDoesNotThrow(
                () ->
                        authoringService.updateProblem(
                                problemId, update(List.of("x", "y"), null, null)));

        AdminDsaProblemDto after =
                authoringService.updateProblem(
                        problemId, update(List.of("p", "q", "r"), null, null));
        assertEquals(List.of("p", "q", "r"), after.hints().stream().map(h -> h.body()).toList());
    }

    /**
     * A null collection means "leave it alone", which is what lets one tab save without the rest.
     */
    @Test
    void leavesCollectionsAloneWhenTheyAreNull() {
        AdminDsaProblemDto saved =
                authoringService.updateProblem(problemId, update(null, null, null));

        assertEquals(2, saved.hints().size(), "hints were not sent, so they should survive");
        assertEquals(2, saved.testCases().size());
        assertEquals(1, saved.harnesses().size());
    }

    @Test
    void keepsGeneratedExpectedOutputWhenTheInputIsUnchanged() {
        AdminDsaProblemDto saved =
                authoringService.updateProblem(
                        problemId,
                        update(
                                null,
                                List.of(
                                        // Same input, blank expected: the stored answer stands.
                                        new DsaProblemUpdateRequest.TestCaseUpdate(
                                                "1 2", "", true, "now explained"),
                                        new DsaProblemUpdateRequest.TestCaseUpdate(
                                                "4 5", "", false, null)),
                                null));

        assertEquals("3", saved.testCases().get(0).expectedOutput());
        assertEquals("now explained", saved.testCases().get(0).explanation());
        assertEquals("9", saved.testCases().get(1).expectedOutput());
    }

    /** A changed input invalidates the answer that was generated for the old one. */
    @Test
    void clearsExpectedOutputWhenTheInputChanges() {
        AdminDsaProblemDto saved =
                authoringService.updateProblem(
                        problemId,
                        update(
                                null,
                                List.of(
                                        new DsaProblemUpdateRequest.TestCaseUpdate(
                                                "7 8", "", true, null)),
                                null));

        assertEquals("", saved.testCases().get(0).expectedOutput());
        assertEquals(1, saved.testCases().size(), "the second case was dropped from the list");
    }

    @Test
    void rejectsADriverWithoutThePlaceholder() {
        assertThrows(
                com.learnnow.common.exception.ValidationException.class,
                () ->
                        authoringService.updateProblem(
                                problemId,
                                update(
                                        null,
                                        null,
                                        List.of(
                                                new DsaProblemUpdateRequest.HarnessUpdate(
                                                        "cpp",
                                                        "// starter",
                                                        "int main(){}",
                                                        null)))));
    }

    @Test
    void previewServesADraftThatTheLearnerEndpointRefuses() {
        assertThrows(
                com.learnnow.common.exception.NotFoundException.class,
                () -> catalogService.problemById(problemId, null),
                "a draft must stay invisible to learners");

        DsaProblemDetailDto preview = catalogService.previewById(problemId, null);
        assertEquals("alpha", preview.slug());
        assertEquals(2, preview.hints().size());
        // The learner DTO has no field for a driver or a reference solution, only the stub.
        assertEquals(1, preview.harnesses().size());
        assertEquals("cpp", preview.harnesses().get(0).language());
    }

    @Test
    void renamesAndClearsASectionTitle() {
        AdminDsaSheetDto sheet = authoringService.sheetById(sheetId);
        UUID sectionId = sheet.steps().get(0).sections().get(0).id();

        authoringService.updateSection(sectionId, new DsaSectionUpdateRequest("Renamed", null));
        assertEquals("Renamed", sectionRepository.findById(sectionId).orElseThrow().getTitle());

        // Blank clears it: an untitled section is what makes a step render flat.
        authoringService.updateSection(sectionId, new DsaSectionUpdateRequest("  ", null));
        assertNull(sectionRepository.findById(sectionId).orElseThrow().getTitle());
    }

    @Test
    void deletingASectionTakesItsSubtreeAndEveryProblemInIt() {
        AdminDsaSheetDto sheet = authoringService.sheetById(sheetId);
        UUID rootSectionId = sheet.steps().get(0).sections().get(0).id();

        assertTrue(problemRepository.findBySlug("alpha").isPresent());
        assertTrue(problemRepository.findBySlug("beta").isPresent());

        authoringService.deleteSection(rootSectionId);

        assertTrue(problemRepository.findBySlug("alpha").isEmpty());
        assertTrue(
                problemRepository.findBySlug("beta").isEmpty(),
                "the nested section's problems go with it");
        assertTrue(testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId).isEmpty());
    }

    @Test
    void reportsTheParentOfEveryNestedSection() {
        AdminDsaSheetDto sheet = authoringService.sheetById(sheetId);
        List<AdminDsaSheetDto.AdminDsaSectionDto> sections = sheet.steps().get(0).sections();

        assertEquals(2, sections.size());
        AdminDsaSheetDto.AdminDsaSectionDto root =
                sections.stream()
                        .filter(s -> s.parentSectionId() == null)
                        .findFirst()
                        .orElseThrow();
        AdminDsaSheetDto.AdminDsaSectionDto child =
                sections.stream()
                        .filter(s -> s.parentSectionId() != null)
                        .findFirst()
                        .orElseThrow();

        assertEquals(root.id(), child.parentSectionId());
        assertEquals(0, root.depth());
        assertEquals(1, child.depth());
    }
}
