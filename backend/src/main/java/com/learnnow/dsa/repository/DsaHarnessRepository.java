package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaHarness;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaHarnessRepository extends JpaRepository<DsaHarness, UUID> {

    List<DsaHarness> findByProblemId(UUID problemId);

    Optional<DsaHarness> findByProblemIdAndLanguageIgnoreCase(UUID problemId, String language);
}
