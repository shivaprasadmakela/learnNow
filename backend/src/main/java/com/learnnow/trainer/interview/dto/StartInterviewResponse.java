package com.learnnow.trainer.interview.dto;

import java.util.UUID;

public record StartInterviewResponse(UUID interviewId, String url, String token) {}
