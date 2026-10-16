package com.learnnow.interview.dto.response;

import java.util.UUID;

/**
 * {@code newReport} is false when a report from the same source already existed and the questions
 * were added to it. {@code alreadyLinked} counts questions it covered before this request.
 */
public record SightingResultDto(
        UUID reportId, boolean newReport, int questionsLinked, int alreadyLinked) {}
