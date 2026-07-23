package com.learnnow.admin.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.learnnow.paths.entity.Subtopic;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "content_blocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "subtopic")
public class ContentBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(nullable = false, length = 20)
    private String type; // "markdown" | "quiz" | "callout"

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subtopic_id", nullable = false)
    @JsonIgnore
    private Subtopic subtopic;

    @OneToMany(mappedBy = "block", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizQuestion> questions = new ArrayList<>();
}
