package com.learnnow.privacy.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * The person a learner names under s.14 to exercise their rights if they die or are incapacitated.
 *
 * <p>The nominee is not verified and gets no account. Naming someone is a statement of intent, and
 * checking it at nomination time would mean emailing a stranger to confirm they are willing to
 * handle someone's data after that person dies. Identity is established if and when they actually
 * come forward.
 */
@Entity
@Table(name = "user_nominees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNominee {

    /** One nominee per learner, so the owning user is the key. */
    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(length = 64)
    private String relationship;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
