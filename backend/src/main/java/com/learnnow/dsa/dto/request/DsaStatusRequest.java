package com.learnnow.dsa.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Manual status override.
 *
 * <p>Kept for problems that have no harness yet, where the learner's own word is the only signal
 * available. Where a problem is judgeable, Submit is what should be moving this.
 */
public record DsaStatusRequest(@NotBlank String status) {}
