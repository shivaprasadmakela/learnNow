package com.learnnow.paths.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.UUID;

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

    @Builder.Default
    private int version = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    @JsonIgnore
    private Topic topic;
}
