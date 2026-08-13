package com.learnnow.compiler.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shared_snippets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedSnippet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "short_id", nullable = false, unique = true, length = 12)
    private String shortId;

    @Column(name = "code_hash", nullable = false, unique = true, length = 64)
    private String codeHash;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "last_accessed_at", nullable = false)
    @Builder.Default
    private Instant lastAccessedAt = Instant.now();
}
