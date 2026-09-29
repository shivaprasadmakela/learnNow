package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaHarness;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DsaHarnessRepository extends JpaRepository<DsaHarness, UUID> {

    List<DsaHarness> findByProblemId(UUID problemId);

    /**
     * Every harness belonging to any of the given problems, in one query.
     *
     * <p>The import walks hundreds of problems, and asking per problem is what made it cost a
     * second each: the database is a continent away from the service, so the round trip dominates
     * and the query itself is free. One IN is one round trip whatever the problem count.
     */
    List<DsaHarness> findByProblemIdIn(Collection<UUID> problemIds);

    /**
     * How many harnesses each problem in a sheet has.
     *
     * <p>A count, not the entities. The admin view only shows the number, and a harness carries the
     * driver, the starter and the reference solution - three source files each. Loading all of them
     * per problem to call {@code .size()} moved megabytes across a continent to render an integer.
     */
    @Query(
            "SELECT h.problem.id, COUNT(h) FROM DsaHarness h"
                    + " WHERE h.problem.section.step.sheet.id = :sheetId"
                    + " GROUP BY h.problem.id")
    List<Object[]> countBySheetIdGroupedByProblem(@Param("sheetId") UUID sheetId);

    Optional<DsaHarness> findByProblemIdAndLanguageIgnoreCase(UUID problemId, String language);
}
