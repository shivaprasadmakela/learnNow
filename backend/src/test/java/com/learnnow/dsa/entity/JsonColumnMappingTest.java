package com.learnnow.dsa.entity;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.Column;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.junit.jupiter.api.Test;

/**
 * Guards a mistake that costs an afternoon every time it is made.
 *
 * <p>{@code @Column(columnDefinition = "JSONB")} only affects DDL generation. It does nothing to
 * how the value is bound, so a {@code String} field mapped to a {@code jsonb} column without
 * {@code @JdbcTypeCode(SqlTypes.JSON)} is sent as varchar and Postgres refuses it:
 *
 * <pre>column "tags" is of type jsonb but expression is of type character varying</pre>
 *
 * <p>Which surfaces as a 500 from whatever endpoint happened to write it, with no hint that the
 * cause is a missing annotation. The existing course entities ({@code QuizQuestion.options}, {@code
 * Subtopic.prerequisites}) both carry it; this asserts the DSA ones do too, and will fail for any
 * JSONB field added later without it.
 *
 * <p>No database needed, so unlike a Testcontainers test this actually runs on a laptop without
 * Docker — which is where this bug got introduced.
 */
class JsonColumnMappingTest {

    private static final List<Class<?>> DSA_ENTITIES =
            List.of(
                    DsaSheet.class,
                    DsaStep.class,
                    DsaSection.class,
                    DsaProblem.class,
                    DsaApproach.class,
                    DsaHint.class,
                    DsaHarness.class,
                    DsaTestCase.class,
                    DsaCheck.class,
                    UserDsaProblemProgress.class,
                    UserDsaSubmission.class,
                    // Notes and bookmarks were unified into these two; both are JSONB-free today,
                    // and listing them means a JSONB column added later is covered from the start.
                    com.learnnow.notes.entity.Note.class,
                    com.learnnow.notes.entity.Bookmark.class);

    @Test
    void everyJsonbColumnDeclaresItsJdbcType() {
        List<String> unmapped = new ArrayList<>();

        for (Class<?> entity : DSA_ENTITIES) {
            for (Field field : entity.getDeclaredFields()) {
                Column column = field.getAnnotation(Column.class);
                if (column == null) continue;
                if (!column.columnDefinition().toUpperCase().contains("JSON")) continue;

                JdbcTypeCode jdbcType = field.getAnnotation(JdbcTypeCode.class);
                if (jdbcType == null || jdbcType.value() != SqlTypes.JSON) {
                    unmapped.add(entity.getSimpleName() + "." + field.getName());
                }
            }
        }

        assertThat(unmapped)
                .as(
                        "JSONB columns missing @JdbcTypeCode(SqlTypes.JSON) - Postgres will reject"
                                + " the varchar binding at runtime")
                .isEmpty();
    }

    @Test
    void theTwoKnownJsonbFieldsAreStillCovered() {
        // Named explicitly so that deleting the field, rather than fixing it, is also caught.
        assertThat(hasJsonMapping(DsaProblem.class, "tags")).isTrue();
        assertThat(hasJsonMapping(DsaCheck.class, "options")).isTrue();
    }

    private static boolean hasJsonMapping(Class<?> entity, String fieldName) {
        try {
            JdbcTypeCode annotation =
                    entity.getDeclaredField(fieldName).getAnnotation(JdbcTypeCode.class);
            return annotation != null && annotation.value() == SqlTypes.JSON;
        } catch (NoSuchFieldException e) {
            return false;
        }
    }
}
