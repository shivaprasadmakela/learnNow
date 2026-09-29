package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaTestCase;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DsaTestCaseRepository extends JpaRepository<DsaTestCase, UUID> {

    List<DsaTestCase> findByProblemIdOrderByOrderIndexAsc(UUID problemId);

    /**
     * Every test case belonging to any of the given problems, in one query.
     *
     * <p>The import walks hundreds of problems, and asking per problem is what made it cost a
     * second each: the database is a continent away from the service, so the round trip dominates
     * and the query itself is free. One IN is one round trip whatever the problem count.
     */
    List<DsaTestCase> findByProblemIdInOrderByOrderIndexAsc(Collection<UUID> problemIds);

    /**
     * Every expected output in a sheet, as (problemId, expectedOutput) pairs.
     *
     * <p>The admin sheet view needs two numbers per problem - how many cases there are and how many
     * still have no expected output - and used to get them by querying each problem in turn. At 61
     * problems that was 61 round trips for six figures of information.
     *
     * <p>The blank test is deliberately left to the caller rather than pushed into SQL as a {@code
     * TRIM(...) = ''}. Java's {@code isBlank} counts tabs and newlines as blank and SQL's {@code
     * TRIM} does not, so computing it here would quietly change which cases are reported as
     * incomplete. Only the expected output is selected, so the large {@code input} column stays out
     * of the transfer.
     */
    @Query(
            "SELECT tc.problem.id, tc.expectedOutput FROM DsaTestCase tc"
                    + " WHERE tc.problem.section.step.sheet.id = :sheetId")
    List<Object[]> findExpectedOutputsBySheetId(@Param("sheetId") UUID sheetId);

    List<DsaTestCase> findByProblemIdAndSampleTrueOrderByOrderIndexAsc(UUID problemId);
}
