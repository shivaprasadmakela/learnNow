package com.learnnow.paths.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "subtopics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "path")
public class Subtopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String category; // "course" | "lab"
    
    private String duration;

    @JsonProperty("isCompleted")
    private boolean isCompleted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id")
    @JsonIgnore
    private Path path;

    @OneToMany(mappedBy = "subtopic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private java.util.List<TopicSection> sections = new java.util.ArrayList<>();
}
