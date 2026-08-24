package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaTestCase;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaTestCaseRepository extends JpaRepository<DsaTestCase, UUID> {

    List<DsaTestCase> findByProblemIdOrderByOrderIndexAsc(UUID problemId);

    List<DsaTestCase> findByProblemIdAndSampleTrueOrderByOrderIndexAsc(UUID problemId);
}
