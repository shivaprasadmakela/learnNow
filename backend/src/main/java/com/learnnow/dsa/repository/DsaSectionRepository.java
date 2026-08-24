package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaSection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DsaSectionRepository extends JpaRepository<DsaSection, UUID> {

    /** Tree order for a whole step. */
    List<DsaSection> findByStepIdOrderByPathAsc(UUID stepId);

    /**
     * A section's siblings - the ones sharing its parent.
     *
     * <p>Written out rather than derived because the parent is nullable, and Spring Data would
     * generate {@code = null} for a null argument where SQL needs {@code IS NULL}.
     */
    @Query(
            "SELECT s FROM DsaSection s WHERE s.step.id = :stepId"
                    + " AND ((:parentId IS NULL AND s.parent IS NULL) OR s.parent.id = :parentId)"
                    + " ORDER BY s.orderIndex ASC")
    List<DsaSection> findSiblings(@Param("stepId") UUID stepId, @Param("parentId") UUID parentId);
}
