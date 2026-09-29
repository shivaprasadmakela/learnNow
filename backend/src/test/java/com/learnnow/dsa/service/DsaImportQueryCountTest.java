package com.learnnow.dsa.service;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.learnnow.dsa.dto.request.DsaImportRequest;
import jakarta.persistence.EntityManagerFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * The import must not ask the database a question per problem.
 *
 * <p>This is a cost test, not a behaviour test, and it exists because the cost was invisible
 * locally and crippling in production. The walk used to issue around seven selects and three
 * flushes for every problem it touched. Against a database on the same machine that is a
 * millisecond and nobody notices; against the real one - the service in Mumbai, the database in
 * Singapore, ~63 ms a round trip - a 54-problem step took 62 seconds, and Cloud Run's request log
 * showed the cost rising in a straight line with problem count.
 *
 * <p>So the assertion is about the <em>slope</em>, not the total. A fixed overhead per import is
 * fine and expected; what must not come back is a per-problem query. Statement counts move with
 * Hibernate versions and batching decisions, which is why nothing here asserts an exact number - a
 * test that has to be re-baselined on every upgrade gets re-baselined without being read.
 */
@SpringBootTest
class DsaImportQueryCountTest extends com.learnnow.AbstractIntegrationTest {

    private static final String DRIVER = "int main(){ {{USER_CODE}} return 0; }";

    @Autowired private DsaImportService importService;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @Test
    void doesNotIssueAQueryPerProblem() {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);

        long forFour = statementsToImport("count-small", 4);
        long forTwentyFour = statementsToImport("count-large", 24);

        // 20 more problems. Before this change that alone bought ~200 more statements.
        long marginalPerProblem = (forTwentyFour - forFour) / 20;

        assertTrue(
                marginalPerProblem <= 3,
                () ->
                        "each extra problem cost "
                                + marginalPerProblem
                                + " statements ("
                                + forFour
                                + " for 4 problems, "
                                + forTwentyFour
                                + " for 24). A per-problem select has come back: every one is a"
                                + " round trip to another continent in production.");
    }

    /** Imports a fresh sheet of {@code problemCount} problems and reports what it cost. */
    private long statementsToImport(String sheetSlug, int problemCount) {
        DsaImportRequest request = sheetOf(sheetSlug, problemCount);

        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        importService.importContent(request);
        return statistics.getPrepareStatementCount();
    }

    private DsaImportRequest sheetOf(String sheetSlug, int problemCount) {
        List<DsaImportRequest.ImportProblem> problems = new ArrayList<>();
        for (int i = 1; i <= problemCount; i++) {
            problems.add(problem(sheetSlug + "-problem-" + i));
        }
        return new DsaImportRequest(
                sheetSlug,
                "Query count " + sheetSlug,
                null,
                null,
                List.of(
                        new DsaImportRequest.ImportStep(
                                "only-step",
                                1,
                                "Only step",
                                null,
                                List.of(
                                        new DsaImportRequest.ImportSection(
                                                "Everything", null, 1, problems, null)))));
    }

    /** Carries a hint list, a harness and test cases, so every per-problem path is exercised. */
    private DsaImportRequest.ImportProblem problem(String slug) {
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
                List.of("first hint", "second hint"),
                new DsaImportRequest.ImportCheck(
                        "Is this cheap?", List.of("yes", "no"), "yes", null, 2),
                List.of(
                        new DsaImportRequest.ImportApproach(
                                "OPTIMAL", "Do it directly", "O(n)", "O(1)", "cpp", "// code")),
                Map.of("cpp", new DsaImportRequest.ImportHarness("// starter", DRIVER, null)),
                List.of(
                        new DsaImportRequest.ImportTestCase("1 2", "3", true, null),
                        new DsaImportRequest.ImportTestCase("4 5", "9", false, null)));
    }
}
