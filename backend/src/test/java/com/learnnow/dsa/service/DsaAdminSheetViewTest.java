package com.learnnow.dsa.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.dto.response.AdminDsaSheetDto;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;

/**
 * The three tallies each row of the authoring studio shows.
 *
 * <p>They used to be counted by querying the test cases and the harnesses of every problem
 * individually - 122 round trips on a 61-problem sheet, which is the whole of that page's seven
 * seconds. They are now two queries for the entire sheet, and these assertions are what make that a
 * refactor rather than a rewrite: the numbers have to come out identical, including the awkward
 * one, which is that an expected output of only whitespace counts as missing.
 */
@SpringBootTest
class DsaAdminSheetViewTest extends com.learnnow.AbstractIntegrationTest {

    private static final String DRIVER = "int main(){ {{USER_CODE}} return 0; }";

    @Autowired private DsaImportService importService;
    @Autowired private DsaAuthoringService authoringService;

    @BeforeEach
    void seed() {
        importService.importContent(
                new DsaImportRequest(
                        "tally-sheet",
                        "Tally sheet",
                        null,
                        null,
                        List.of(
                                new DsaImportRequest.ImportStep(
                                        "tally-step",
                                        1,
                                        "Tally step",
                                        null,
                                        List.of(
                                                new DsaImportRequest.ImportSection(
                                                        "Group",
                                                        null,
                                                        1,
                                                        List.of(rich(), bare()),
                                                        null))))));
    }

    /** Two harnesses, three cases, one of which has no expected output yet. */
    private DsaImportRequest.ImportProblem rich() {
        return problem(
                "tally-rich",
                Map.of(
                        "cpp", new DsaImportRequest.ImportHarness("// starter", DRIVER, null),
                        "python", new DsaImportRequest.ImportHarness("# starter", DRIVER, null)),
                List.of(
                        new DsaImportRequest.ImportTestCase("1", "1", true, null),
                        new DsaImportRequest.ImportTestCase("2", "2", false, null),
                        new DsaImportRequest.ImportTestCase("3", null, false, null)));
    }

    /** No harness at all, and a single complete case. */
    private DsaImportRequest.ImportProblem bare() {
        return problem(
                "tally-bare",
                Map.of(),
                List.of(new DsaImportRequest.ImportTestCase("9", "9", true, null)));
    }

    @Test
    void countsHarnessesCasesAndMissingExpectedOutputsPerProblem() {
        List<AdminDsaSheetDto.AdminDsaProblemRowDto> rows = rowsOfTallySheet();

        AdminDsaSheetDto.AdminDsaProblemRowDto rich = row(rows, "tally-rich");
        assertEquals(2, rich.harnessCount());
        assertEquals(3, rich.testCaseCount());
        assertEquals(1, rich.missingExpectedCount());

        AdminDsaSheetDto.AdminDsaProblemRowDto bare = row(rows, "tally-bare");
        // A problem with no harness rows at all has to read as zero, not drop out of the map.
        assertEquals(0, bare.harnessCount());
        assertEquals(1, bare.testCaseCount());
        assertEquals(0, bare.missingExpectedCount());
    }

    @Test
    void treatsAWhitespaceOnlyExpectedOutputAsMissing() {
        // The reason the blank test stayed in Java: SQL's TRIM would not call "\n" blank, and
        // pushing the count into a GROUP BY would have silently changed this answer.
        //
        // Its own sheet, not the seeded one: a second import of a section with a different problem
        // list puts the new problem back at position 1, where the seeded problem still sits, and
        // trips uq_dsa_problems_section_order. That is the import's behaviour today, unchanged by
        // this work, and not what this test is about.
        importService.importContent(
                new DsaImportRequest(
                        "tally-blank-sheet",
                        "Tally blank sheet",
                        null,
                        null,
                        List.of(
                                new DsaImportRequest.ImportStep(
                                        "tally-step",
                                        1,
                                        "Tally step",
                                        null,
                                        List.of(
                                                new DsaImportRequest.ImportSection(
                                                        "Group",
                                                        null,
                                                        1,
                                                        List.of(
                                                                problem(
                                                                        "tally-blank",
                                                                        Map.of(),
                                                                        List.of(
                                                                                new DsaImportRequest
                                                                                        .ImportTestCase(
                                                                                        "1", "\n\t",
                                                                                        true,
                                                                                        null)))),
                                                        null))))));

        assertEquals(1, row(rowsOf("tally-blank-sheet"), "tally-blank").missingExpectedCount());
    }

    private List<AdminDsaSheetDto.AdminDsaProblemRowDto> rowsOfTallySheet() {
        return rowsOf("tally-sheet");
    }

    private List<AdminDsaSheetDto.AdminDsaProblemRowDto> rowsOf(String sheetSlug) {
        return authoringService.listSheets(Pageable.ofSize(20)).content().stream()
                .filter(sheet -> sheet.slug().equals(sheetSlug))
                .findFirst()
                .orElseThrow()
                .steps()
                .stream()
                .flatMap(step -> step.sections().stream())
                .flatMap(section -> section.problems().stream())
                .toList();
    }

    private AdminDsaSheetDto.AdminDsaProblemRowDto row(
            List<AdminDsaSheetDto.AdminDsaProblemRowDto> rows, String slug) {
        return rows.stream()
                .filter(row -> row.slug().equals(slug))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no row for " + slug));
    }

    private DsaImportRequest.ImportProblem problem(
            String slug,
            Map<String, DsaImportRequest.ImportHarness> harnesses,
            List<DsaImportRequest.ImportTestCase> cases) {
        return new DsaImportRequest.ImportProblem(
                slug,
                "Problem " + slug,
                "A statement",
                "EASY",
                List.of("array"),
                10,
                null,
                null,
                null,
                null,
                "DRAFT",
                null,
                null,
                null,
                harnesses,
                cases);
    }
}
