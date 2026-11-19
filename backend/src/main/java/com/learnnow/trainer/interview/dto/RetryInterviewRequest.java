package com.learnnow.trainer.interview.dto;

import java.util.UUID;

/** {@code questionId} is a {@code planQuestionId} from the earlier interview's report. */
public record RetryInterviewRequest(UUID questionId) {}
