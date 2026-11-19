package com.learnnow.trainer.feature;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** An admin's switch for one AI feature. A feature with no row is on. */
@Entity
@Table(name = "ai_feature_flags")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiFeatureFlag {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private AiFeature feature;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by")
    private String updatedBy;
}
