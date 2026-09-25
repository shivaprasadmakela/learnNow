package com.learnnow.privacy.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

/**
 * One consent decision, as it was made. Append-only.
 *
 * <p>s.6 puts the burden on us to demonstrate that consent was given, which a mutable row cannot
 * do: once withdrawn, an overwritten row says only that consent is absent now, not that it was ever
 * present or when it changed. Nothing updates or deletes these except deleting the account they
 * belong to.
 *
 * <p>There is deliberately no setter-driven lifecycle here. Rows are built once and saved.
 */
@Entity
@Table(name = "user_consent_events")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserConsentEvent {

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ConsentSource source;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
