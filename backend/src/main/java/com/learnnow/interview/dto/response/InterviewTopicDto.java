package com.learnnow.interview.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * The interview questions for one topic of a path - the unit a learner browses by, since a topic
 * title ("Methods", "Collections") says what the questions are about where a subtopic's title reads
 * like a sentence from the lesson.
 */
public record InterviewTopicDto(
        UUID topicId, String topicTitle, List<InterviewQuestionDto> questions) {}
