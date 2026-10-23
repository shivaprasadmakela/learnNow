package com.learnnow.interview.dto.response;

import java.util.UUID;

/**
 * One topic of a path's interview bank, as the topic list shows it: how many questions it holds,
 * not the questions themselves - those load when the learner opens the topic. A topic is the unit a
 * learner browses by, since its title ("Methods", "Collections") says what the questions are about
 * where a subtopic's title reads like a sentence from the lesson.
 */
public record InterviewTopicDto(
        UUID topicId, String topicTitle, int questionCount, int followUpCount) {}
