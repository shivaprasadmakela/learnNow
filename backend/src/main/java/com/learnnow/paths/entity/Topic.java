package com.learnnow.paths.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Topic {

    /*
     * A topic has no owning path. Membership lives entirely in path_topics,
     * because the same topic belongs to several courses at different positions.
     * The old topics.path_id column was a second source of truth that the admin
     * attach flow never populated, so anything reading it got null.
     */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String category; // "course" | "lab"

    private String duration;

    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 1;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;

    @OneToMany(mappedBy = "topic")
    @JsonIgnore
    @Builder.Default
    private List<PathTopic> pathTopics = new ArrayList<>();

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Subtopic> subtopics = new ArrayList<>();
}
