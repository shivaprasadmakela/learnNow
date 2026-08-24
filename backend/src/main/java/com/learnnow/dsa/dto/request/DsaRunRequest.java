package com.learnnow.dsa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * A Run: the sample cases, plus any ad-hoc cases the learner typed into the panel.
 *
 * <p>{@code extraCases} is capped so a caller cannot turn one request into an unbounded amount of
 * engine time by pasting a thousand cases.
 */
public record DsaRunRequest(
        @NotBlank String language,
        @NotBlank @Size(max = 60_000) String code,
        @Size(max = 5) List<@Size(max = 4_000) String> extraCases) {

    public List<String> safeExtraCases() {
        return extraCases == null ? List.of() : extraCases;
    }
}
