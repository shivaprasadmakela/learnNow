package com.learnnow.trainer.plan.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

/** This week's plan. {@code plan} is learnnow-ai's own object, passed through in snake_case. */
public record WeeklyPlanResponse(
        LocalDate weekStart, Instant generatedAt, int refreshesLeft, Map<String, Object> plan) {}
