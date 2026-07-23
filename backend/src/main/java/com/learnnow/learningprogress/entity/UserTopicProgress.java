package com.learnnow.learningprogress.entity;

import com.learnnow.learningprogress.enums.ProgressStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_topic_progress", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "topic_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTopicProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "topic_id", nullable = false)
    private UUID topicId;

    @Column(name = "path_id", nullable = false)
    private UUID pathId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private ProgressStatus status = ProgressStatus.NOT_STARTED;

    @Column(name = "completed_at")
    private Instant completedAt;
}
