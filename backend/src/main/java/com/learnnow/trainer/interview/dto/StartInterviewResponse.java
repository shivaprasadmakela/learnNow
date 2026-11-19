package com.learnnow.trainer.interview.dto;

import java.util.UUID;

/**
 * What the browser needs to join the interview's voice room. {@code maxSeconds} is how long the
 * agent will run; the agent ends the call itself, so the browser's timer is a guide.
 */
public record StartInterviewResponse(
        UUID interviewId, String url, String token, int maxSeconds, String kind) {}
