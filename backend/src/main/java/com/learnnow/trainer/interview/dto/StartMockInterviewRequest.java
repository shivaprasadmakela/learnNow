package com.learnnow.trainer.interview.dto;

import jakarta.validation.constraints.Size;

/**
 * {@code kind} is RESUME, HR, BEHAVIOURAL, PROJECT or FULL; {@code role} overrides the resume's.
 */
public record StartMockInterviewRequest(
        String kind, @Size(max = 120) String role, boolean useJobDescription) {}
