package com.learnnow.compiler.repository;

import com.learnnow.compiler.entity.SharedSnippet;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SharedSnippetRepository extends JpaRepository<SharedSnippet, UUID> {
    Optional<SharedSnippet> findByShortId(String shortId);

    Optional<SharedSnippet> findByCodeHash(String codeHash);
}
