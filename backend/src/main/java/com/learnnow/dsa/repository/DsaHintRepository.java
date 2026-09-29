package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaHint;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaHintRepository extends JpaRepository<DsaHint, UUID> {

    List<DsaHint> findByProblemIdOrderByOrderIndexAsc(UUID problemId);

    /**
     * Every hint belonging to any of the given problems, in one query.
     *
     * <p>The import walks hundreds of problems, and asking per problem is what made it cost a
     * second each: the database is a continent away from the service, so the round trip dominates
     * and the query itself is free. One IN is one round trip whatever the problem count.
     */
    List<DsaHint> findByProblemIdInOrderByOrderIndexAsc(Collection<UUID> problemIds);
}
