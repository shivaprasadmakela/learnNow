package com.learnnow.interview.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * One report of questions being asked: where, for what, when, and which questions from the bank.
 *
 * <p>{@code seenMonth} is "YYYY-MM" - a post says "last month", rarely a date, and claiming a day
 * nobody knows would be inventing it. {@code questionKeys} name questions by their bank key, at any
 * depth: a report can confirm a follow-up was asked without its opener.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RecordSightingRequest(
        @NotBlank @Size(max = 160) String company,
        @Size(max = 160) String role,
        @Size(max = 80) String level,
        @Size(max = 80) String round,
        @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$") String seenMonth,
        @Size(max = 500) String sourceUrl,
        @NotEmpty List<String> questionKeys) {}
