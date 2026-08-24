package com.learnnow.dsa.repository;

import com.learnnow.dsa.entity.DsaProblemStatus;
import com.learnnow.dsa.entity.DsaSheet;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DsaSheetRepository extends JpaRepository<DsaSheet, UUID> {

    Page<DsaSheet> findByStatus(DsaProblemStatus status, Pageable pageable);

    Optional<DsaSheet> findBySlug(String slug);

    Optional<DsaSheet> findBySlugAndStatus(String slug, DsaProblemStatus status);
}
