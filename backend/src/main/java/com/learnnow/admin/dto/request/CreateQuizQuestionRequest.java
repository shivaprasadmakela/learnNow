package com.learnnow.admin.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateQuizQuestionRequest(
        @JsonAlias({"kind", "type"}) String kind,
        @JsonAlias({"prompt", "question", "questionText"}) String prompt,
        @JsonAlias({"options", "choices"}) String options,
        @JsonAlias({"correctAnswer", "answer", "correct"}) String correctAnswer,
        String explanation,
        int points) {}
