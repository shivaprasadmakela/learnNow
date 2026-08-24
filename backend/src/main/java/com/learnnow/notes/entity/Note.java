package com.learnnow.notes.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * One private learner note against one piece of content, of whatever kind.
 *
 * <p>Exactly one of the three target columns is set - enforced by a CHECK constraint, not by
 * convention. Keeping real foreign keys rather than a polymorphic {@code target_id} means a deleted
 * topic takes its notes with it instead of leaving them pointing at nothing.
 */
@Entity
@Table(name = "notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "subtopic_id")
    private UUID subtopicId;

    @Column(name = "topic_id")
    private UUID topicId;

    @Column(name = "dsa_problem_id")
    private UUID dsaProblemId;

    @Column(columnDefinition = "TEXT", nullable = false)
    @Builder.Default
    private String content = "";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Derived from whichever target column is populated, never stored. */
    @Transient
    public NoteTarget getTarget() {
        if (subtopicId != null) return NoteTarget.SUBTOPIC;
        if (topicId != null) return NoteTarget.TOPIC;
        return NoteTarget.DSA_PROBLEM;
    }

    @Transient
    public UUID getTargetId() {
        if (subtopicId != null) return subtopicId;
        if (topicId != null) return topicId;
        return dsaProblemId;
    }

    /** Points this note at {@code targetId}, clearing whatever it pointed at before. */
    public void pointAt(NoteTarget target, UUID targetId) {
        subtopicId = target == NoteTarget.SUBTOPIC ? targetId : null;
        topicId = target == NoteTarget.TOPIC ? targetId : null;
        dsaProblemId = target == NoteTarget.DSA_PROBLEM ? targetId : null;
    }
}
