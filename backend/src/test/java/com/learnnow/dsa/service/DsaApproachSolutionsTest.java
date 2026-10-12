package com.learnnow.dsa.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.dsa.dto.response.DsaSolutionDto;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DsaApproachSolutionsTest {

    private final DsaApproachSolutions solutions = new DsaApproachSolutions(new ObjectMapper());

    @Test
    void writesCanonicalIdsInThePickerOrder() {
        Map<String, String> input = new LinkedHashMap<>();
        input.put("C++", "int x;");
        input.put("Java", "class Solution {}");
        input.put("py", "class Solution: pass");
        input.put("js", "class Solution {}");

        assertThat(solutions.read(solutions.write(input)))
                .extracting(DsaSolutionDto::language)
                .containsExactly("javascript", "python", "java", "cpp");
    }

    @Test
    void dropsBlankCodeAndTrailingWhitespace() {
        Map<String, String> input = new LinkedHashMap<>();
        input.put("java", "class Solution {   \n}\n\n");
        input.put("python", "   ");

        assertThat(solutions.read(solutions.write(input)))
                .containsExactly(new DsaSolutionDto("java", "class Solution {\n}"));
    }

    @Test
    void collectMergesTheLegacySingleLanguageShape() {
        Map<String, String> merged =
                DsaApproachSolutions.collect(Map.of("python", "py code"), null, "java code");

        assertThat(merged).containsEntry("java", "java code").containsEntry("python", "py code");
    }

    @Test
    void collectPrefersSolutionsOverTheLegacyFieldForTheSameLanguage() {
        Map<String, String> merged =
                DsaApproachSolutions.collect(Map.of("java", "new"), "java", "old");

        assertThat(merged).containsExactly(Map.entry("java", "new"));
    }

    @Test
    void readsAMalformedColumnAsEmpty() {
        assertThat(solutions.read("{not json")).isEmpty();
        assertThat(solutions.read(null)).isEmpty();
    }

    @Test
    void rejectsAnUnreasonableLanguageId() {
        assertThatThrownBy(() -> solutions.write(Map.of("x".repeat(40), "code")))
                .isInstanceOf(ValidationException.class);
    }
}
