package com.learnnow.admin.dto;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.admin.dto.request.ImportCourseRequest;
import com.learnnow.admin.dto.response.AdminPathDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Course JSON in the wild carries two shapes for a quiz question: the canonical
 * prompt/correctAnswer, and a legacy question/answer. Both DTOs that bind course payloads must
 * accept both, because a silent null reaches the database as a not-null violation on
 * quiz_questions.prompt that aborts the whole batch.
 */
class ImportQuestionRequestTest {

    private static final String CANONICAL =
            """
            {"kind":"mcq","prompt":"Which is idempotent?","options":["GET","POST"],
             "correctAnswer":"GET","explanation":"per the HTTP spec","points":10}
            """;

    /** The shape of the entries that failed the real import. */
    private static final String LEGACY =
            "{\"question\":\"What is binary 1 + 1?\",\"answer\":\"10\"}";

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @DisplayName("import DTO binds both shapes")
    void importDtoBindsBothShapes() throws Exception {
        var a = mapper.readValue(CANONICAL, ImportCourseRequest.ImportQuestionRequest.class);
        assertEquals("Which is idempotent?", a.prompt());
        assertEquals("GET", a.correctAnswer());
        assertEquals(10, a.points());

        var b = mapper.readValue(LEGACY, ImportCourseRequest.ImportQuestionRequest.class);
        assertEquals("What is binary 1 + 1?", b.prompt());
        assertEquals("10", b.correctAnswer());
    }

    @Test
    @DisplayName("admin save DTO binds both shapes - this is the one that was failing")
    void adminDtoBindsBothShapes() throws Exception {
        var a = mapper.readValue(CANONICAL, AdminPathDto.AdminQuizQuestionDto.class);
        assertEquals("Which is idempotent?", a.prompt());
        assertEquals("GET", a.correctAnswer());

        // Before the alias was added this bound to nothing, so prompt was null and the
        // insert failed on the not-null constraint.
        var b = mapper.readValue(LEGACY, AdminPathDto.AdminQuizQuestionDto.class);
        assertEquals("What is binary 1 + 1?", b.prompt(), "question must alias onto prompt");
        assertEquals("10", b.correctAnswer(), "answer must alias onto correctAnswer");
    }

    @Test
    @DisplayName("unknown fields do not break binding")
    void unknownFieldsTolerated() throws Exception {
        String json = "{\"question\":\"Q\",\"answer\":\"A\",\"somethingNew\":123}";
        var q = mapper.readValue(json, ImportCourseRequest.ImportQuestionRequest.class);
        assertEquals("Q", q.prompt());
    }
}
