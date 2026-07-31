package com.learnnow.compiler.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SharedSnippetRepository extends JpaRepository<SharedSnippet, UUID> {
    Optional<SharedSnippet> findByShortId(String shortId);
    Optional<SharedSnippet> findByCodeHash(String codeHash);
}
