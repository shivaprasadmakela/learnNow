package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaCheck;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaCheckRepository extends JpaRepository<DsaCheck, UUID> {

    List<DsaCheck> findByProblemIdOrderByOrderIndexAsc(UUID problemId);

    /**
     * Every check belonging to any of the given problems, in one query.
     *
     * <p>The import walks hundreds of problems, and asking per problem is what made it cost a
     * second each: the database is a continent away from the service, so the round trip dominates
     * and the query itself is free. One IN is one round trip whatever the problem count.
     */
    List<DsaCheck> findByProblemIdInOrderByOrderIndexAsc(Collection<UUID> problemIds);
}
