package com.learnnow.trainer.interview.dto;

public record InterviewAvailabilityResponse(boolean available, String reason, int leftThisMonth) {}
