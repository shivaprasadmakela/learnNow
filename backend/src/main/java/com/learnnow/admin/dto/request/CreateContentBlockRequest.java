package com.learnnow.admin.dto.request;

import java.util.List;

public record CreateContentBlockRequest(
        int orderIndex, String type, String body, List<CreateQuizQuestionRequest> questions) {}
