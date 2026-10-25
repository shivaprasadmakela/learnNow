package com.learnnow.trainer.interview.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TranscriptCallbackRequest(
        UUID interview_id,
        List<TurnPayload> turns,
        BigDecimal minutes,
        BigDecimal cost_inr,
        String ended_reason) {

    public record TurnPayload(String role, String text, BigDecimal at, UUID question_id) {}
}
