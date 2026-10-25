package com.learnnow.trainer.dto;

import java.util.List;

/**
 * What the trainer holds about the learner, for the learner to see. {@code personalised} is false
 * when the PERSONALISATION consent is withdrawn; the trainer then uses none of it.
 */
public record TrainerProfileResponse(
        boolean available,
        boolean voiceAvailable,
        boolean personalised,
        int interviewsLeftThisMonth,
        GoalResponse goal,
        List<NoteResponse> notes) {}
