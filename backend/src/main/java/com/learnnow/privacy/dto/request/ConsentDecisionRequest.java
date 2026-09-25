package com.learnnow.privacy.dto.request;

import com.learnnow.privacy.entity.ConsentPurpose;
import jakarta.validation.constraints.NotNull;

/**
 * One purpose, one answer.
 *
 * <p>The consent centre submits a list of these rather than a map of booleans so that an unfamiliar
 * purpose name fails validation instead of being silently dropped — a dropped purpose would leave
 * the learner's screen and the stored state disagreeing about what they just chose.
 */
public record ConsentDecisionRequest(@NotNull ConsentPurpose purpose, @NotNull Boolean granted) {}
