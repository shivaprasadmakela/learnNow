package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaHint;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaHintRepository extends JpaRepository<DsaHint, UUID> {

    List<DsaHint> findByProblemIdOrderByOrderIndexAsc(UUID problemId);
}
