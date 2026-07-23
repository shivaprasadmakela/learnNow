package com.learnnow.admin.api.dto;

import java.util.List;

public record CreateContentBlockRequest(
    int orderIndex,
    String type,
    String body,
    List<CreateQuizQuestionRequest> questions
) {}
