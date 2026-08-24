package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaCheck;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaCheckRepository extends JpaRepository<DsaCheck, UUID> {

    List<DsaCheck> findByProblemIdOrderByOrderIndexAsc(UUID problemId);
}
