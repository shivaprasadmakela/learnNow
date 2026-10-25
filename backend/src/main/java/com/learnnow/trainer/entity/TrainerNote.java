package com.learnnow.trainer.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One short fact the AI trainer drew from a conversation, e.g. "confused about @Transactional
 * propagation". Written by the AI, so it can be wrong: the learner sees every note and can delete
 * any of them.
 */
@Entity
@Table(name = "trainer_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainerNote {

    @Id private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    /** goal, gap, strength or preference. */
    @Column(nullable = false, length = 20)
    private String kind;

    @Column(nullable = false, length = 240)
    private String text;

    @Column(nullable = false, length = 40)
    private String source;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
