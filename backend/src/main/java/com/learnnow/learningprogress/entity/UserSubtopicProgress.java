package com.learnnow.learningprogress.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_subtopic_progress", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "subtopic_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubtopicProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "subtopic_id", nullable = false)
    private Long subtopicId;

    @Column(name = "topic_id", nullable = false)
    private Long topicId;

    @Column(nullable = false)
    @Builder.Default
    private boolean completed = false;

    @Column(name = "completed_at")
    private Instant completedAt;
}
