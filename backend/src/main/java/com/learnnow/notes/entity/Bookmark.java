package com.learnnow.notes.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Saved for later, across content types.
 *
 * <p>Replaces both {@code topic_bookmarks} and the {@code marked_for_revision} flag that DSA
 * progress carried: starring a problem to come back to and bookmarking a topic are the same idea,
 * so they are the same table and the same filterable list.
 */
@Entity
@Table(name = "bookmarks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "topic_id")
    private UUID topicId;

    @Column(name = "dsa_problem_id")
    private UUID dsaProblemId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Transient
    public NoteTarget getTarget() {
        return topicId != null ? NoteTarget.TOPIC : NoteTarget.DSA_PROBLEM;
    }

    @Transient
    public UUID getTargetId() {
        return topicId != null ? topicId : dsaProblemId;
    }
}
