package com.learnnow.paths.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "path")
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String category; // "course" | "lab"
    
    private String duration;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id")
    @JsonIgnore
    private Path path;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Subtopic> subtopics = new ArrayList<>();
}
