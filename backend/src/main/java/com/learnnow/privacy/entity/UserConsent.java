package com.learnnow.privacy.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * The learner's current answer for one purpose: may we, or may we not.
 *
 * <p>This row is overwritten each time they change their mind, so it cannot serve as proof that
 * consent was ever given — {@link UserConsentEvent} exists for that. Keeping the two apart means a
 * permission check stays a single indexed read instead of a scan back through history.
 */
@Entity
@Table(name = "user_consents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ConsentPurpose purpose;

    @Column(nullable = false)
    private boolean granted;

    @Column(name = "notice_version", nullable = false, length = 16)
    private String noticeVersion;

    @Column(name = "decided_at", nullable = false)
    @Builder.Default
    private Instant decidedAt = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
