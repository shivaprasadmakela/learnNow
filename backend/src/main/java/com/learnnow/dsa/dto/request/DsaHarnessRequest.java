package com.learnnow.dsa.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Upserts one language's harness.
 *
 * <p>The placeholder check is enforced by the database too, but validating here turns a constraint
 * violation into a readable message at the point the author can still fix it.
 */
public record DsaHarnessRequest(
        @NotBlank String starterCode, @NotBlank String driverCode, String referenceSolution) {}
