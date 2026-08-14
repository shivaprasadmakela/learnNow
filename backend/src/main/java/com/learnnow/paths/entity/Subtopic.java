package com.learnnow.paths.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "subtopics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "topic")
public class Subtopic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int orderIndex;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;

    @Builder.Default private int version = 1;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String level = "beginner";

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String track = "concept";

    @Builder.Default
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "JSONB", nullable = false)
    private String prerequisites = "[]";

    @Column(name = "video_url", length = 512)
    private String videoUrl;

    @Builder.Default
    @Column(name = "estimated_minutes", nullable = false)
    private int estimatedMinutes = 5;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    @JsonIgnore
    private Topic topic;

    @OneToMany(mappedBy = "subtopic", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<com.learnnow.admin.entity.ContentBlock> blocks =
            new java.util.ArrayList<>();

    @OneToMany(mappedBy = "subtopic", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<SubtopicCodeSnippet> codeSnippets = new java.util.ArrayList<>();
}
