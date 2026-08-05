package com.learnnow.paths.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "subtopic_code_snippets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(SubtopicCodeSnippet.SnippetId.class)
public class SubtopicCodeSnippet {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SnippetId implements Serializable {
        private Subtopic subtopic;
        private String id;
    }

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subtopic_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Subtopic subtopic;

    @Id
    @Column(length = 100, nullable = false)
    private String id;

    @Column(nullable = false, length = 30)
    private String language;

    private String label;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;

    @Builder.Default
    @Column(nullable = false)
    private boolean runnable = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean editable = true;

    @Builder.Default
    @Column(name = "order_index", nullable = false)
    private int orderIndex = 1;
}
