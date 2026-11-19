package com.learnnow.trainer.interview.dto;

import jakarta.validation.constraints.Size;

/** The learner's verdict on an evaluation: 1 fair, -1 unfair, with an optional reason. */
public record RatingRequest(Integer rating, @Size(max = 500) String comment) {}
