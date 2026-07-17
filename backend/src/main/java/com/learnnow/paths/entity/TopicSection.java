package com.learnnow.paths.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "topic_sections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "subtopic")
public class TopicSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int orderIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subtopic_id")
    @JsonIgnore
    private Subtopic subtopic;
}
