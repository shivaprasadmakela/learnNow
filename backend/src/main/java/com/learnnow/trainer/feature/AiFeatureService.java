package com.learnnow.trainer.feature;

import com.learnnow.common.exception.AiFeatureOffException;
import java.time.Instant;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin switches for the AI features. Read on nearly every trainer request, so the switches are
 * cached for {@link #CACHE_MILLIS}: a change made on another instance takes effect within that
 * time, and this instance's own changes at once.
 */
@Service
@RequiredArgsConstructor
public class AiFeatureService {

    static final long CACHE_MILLIS = 30_000;

    private final AiFeatureFlagRepository repository;

    private volatile Map<AiFeature, Boolean> cached;
    private volatile long cachedAt;

    public record FlagView(AiFeature feature, boolean enabled, Instant updatedAt) {}

    public boolean enabled(AiFeature feature) {
        return flags().getOrDefault(feature, true);
    }

    /** Throws 503 {@code ai_feature_off} when an admin has switched the feature off. */
    public void requireEnabled(AiFeature feature) {
        if (!enabled(feature)) {
            throw new AiFeatureOffException();
        }
    }

    /** Every feature, including those with no row (on, never changed: updatedAt null). */
    @Transactional(readOnly = true)
    public List<FlagView> all() {
        Map<AiFeature, AiFeatureFlag> rows = new EnumMap<>(AiFeature.class);
        repository.findAll().forEach(f -> rows.put(f.getFeature(), f));
        return Arrays.stream(AiFeature.values())
                .map(
                        f -> {
                            AiFeatureFlag row = rows.get(f);
                            return row == null
                                    ? new FlagView(f, true, null)
                                    : new FlagView(f, row.isEnabled(), row.getUpdatedAt());
                        })
                .toList();
    }

    @Transactional
    public void setEnabled(AiFeature feature, boolean enabled, String adminId) {
        AiFeatureFlag flag =
                repository
                        .findById(feature)
                        .orElseGet(() -> AiFeatureFlag.builder().feature(feature).build());
        flag.setEnabled(enabled);
        flag.setUpdatedAt(Instant.now());
        flag.setUpdatedBy(adminId);
        repository.save(flag);
        cached = null;
    }

    /** Drops the cache, so the next read sees the table. */
    public void forgetCache() {
        cached = null;
    }

    private Map<AiFeature, Boolean> flags() {
        Map<AiFeature, Boolean> current = cached;
        long now = System.currentTimeMillis();
        if (current == null || now - cachedAt > CACHE_MILLIS) {
            Map<AiFeature, Boolean> fresh = new EnumMap<>(AiFeature.class);
            repository.findAll().forEach(f -> fresh.put(f.getFeature(), f.isEnabled()));
            current = fresh;
            cached = fresh;
            cachedAt = now;
        }
        return current;
    }
}
