package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaApproach;
import com.learnnow.dsa.entity.DsaApproachKind;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DsaApproachRepository extends JpaRepository<DsaApproach, UUID> {

    List<DsaApproach> findByProblemIdOrderByOrderIndexAsc(UUID problemId);

    /** The columns an editorial's outline needs, and none of the reasoning or code. */
    interface Summary {
        UUID getId();

        DsaApproachKind getKind();

        int getOrderIndex();

        String getTimeComplexity();

        String getSpaceComplexity();
    }

    /**
     * A problem's approaches without their intuition or solutions.
     *
     * <p>The problem page shows only how many approaches there are and what kind, until the learner
     * opens the editorial. Selecting the columns keeps the intuition text and every language's code
     * out of the read as well as out of the response.
     */
    @Query(
            "SELECT a.id AS id, a.kind AS kind, a.orderIndex AS orderIndex,"
                    + " a.timeComplexity AS timeComplexity, a.spaceComplexity AS spaceComplexity"
                    + " FROM DsaApproach a WHERE a.problem.id = :problemId"
                    + " ORDER BY a.orderIndex ASC")
    List<Summary> findSummariesByProblemId(@Param("problemId") UUID problemId);

    /**
     * Every approach belonging to any of the given problems, in one query.
     *
     * <p>The import walks hundreds of problems, and asking per problem is what made it cost a
     * second each: the database is a continent away from the service, so the round trip dominates
     * and the query itself is free. One IN is one round trip whatever the problem count.
     */
    List<DsaApproach> findByProblemIdInOrderByOrderIndexAsc(Collection<UUID> problemIds);
}
