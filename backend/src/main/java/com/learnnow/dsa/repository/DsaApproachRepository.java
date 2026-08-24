package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaApproach;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaApproachRepository extends JpaRepository<DsaApproach, UUID> {

    List<DsaApproach> findByProblemIdOrderByOrderIndexAsc(UUID problemId);
}
