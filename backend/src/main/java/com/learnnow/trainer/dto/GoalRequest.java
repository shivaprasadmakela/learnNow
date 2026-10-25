package com.learnnow.trainer.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** The learner's goal. Any field may be null: a goal can be set a piece at a time. */
public record GoalRequest(
        @Size(max = 120) String targetRole,
        LocalDate targetDate,
        @Min(1) @Max(80) Short hoursPerWeek) {}
