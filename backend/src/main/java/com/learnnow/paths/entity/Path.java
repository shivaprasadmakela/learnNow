package com.learnnow.paths.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "paths")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Path {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String category;

    private String managedBy;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;

    @OneToMany(
            mappedBy = "path",
            cascade = CascadeType.ALL,
            fetch = FetchType.LAZY,
            orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<PathTopic> pathTopics = new ArrayList<>();

    public List<Topic> getTopics() {
        if (pathTopics == null) return List.of();
        return pathTopics.stream()
                .map(PathTopic::getTopic)
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}
