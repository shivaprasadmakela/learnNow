package com.learnnow.dsa.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.dsa.dto.response.DsaApproachDto;
import com.learnnow.dsa.dto.response.DsaSolutionDto;
import com.learnnow.dsa.entity.DsaApproach;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Reads and writes {@link DsaApproach#getSolutions()}, the per-language code of an editorial
 * approach.
 *
 * <p>Every way in - the import JSON, the authoring modal - goes through {@link #write}, so the
 * stored ids are always the compiler's own ({@code cpp}, never {@code c++}), a language appears at
 * most once, and the order is the same one the workspace's language picker uses. The learner view
 * can then key its language switcher straight off the stored ids.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DsaApproachSolutions {

    /** The workspace picker's order. Anything else sorts after these, alphabetically. */
    private static final List<String> LANGUAGE_ORDER =
            List.of("javascript", "python", "java", "cpp", "typescript", "c");

    private static final Map<String, String> ALIASES =
            Map.ofEntries(
                    Map.entry("js", "javascript"),
                    Map.entry("node", "javascript"),
                    Map.entry("py", "python"),
                    Map.entry("python3", "python"),
                    Map.entry("c++", "cpp"),
                    Map.entry("g++", "cpp"),
                    Map.entry("ts", "typescript"),
                    Map.entry("golang", "go"));

    private static final int MAX_LANGUAGE_LENGTH = 24;

    private static final TypeReference<List<DsaSolutionDto>> SOLUTION_LIST =
            new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    /** The canonical id for a language name, or null for a blank one. */
    public static String normalizeLanguage(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String lower = raw.trim().toLowerCase(Locale.ROOT);
        return ALIASES.getOrDefault(lower, lower);
    }

    /**
     * Gathers an approach's code from a request into one language-keyed map.
     *
     * <p>{@code legacyLanguage}/{@code legacyCode} is the single-language shape every approach had
     * before {@code solutions} existed. It is still accepted so older import files keep working,
     * and when both are given, an entry in {@code solutions} wins for the same language.
     */
    public static Map<String, String> collect(
            Map<String, String> solutions, String legacyLanguage, String legacyCode) {
        Map<String, String> merged = new LinkedHashMap<>();
        if (legacyCode != null && !legacyCode.isBlank()) {
            String language = normalizeLanguage(legacyLanguage);
            merged.put(language == null ? "java" : language, legacyCode);
        }
        if (solutions != null) {
            solutions.forEach(
                    (language, code) -> {
                        String id = normalizeLanguage(language);
                        if (id != null && code != null && !code.isBlank()) merged.put(id, code);
                    });
        }
        return merged;
    }

    /**
     * Serialises the solutions for storage: canonical ids, blank code dropped, stable order.
     *
     * @throws ValidationException if a language id is unreasonably long
     */
    public String write(Map<String, String> byLanguage) {
        Map<String, String> normalized = new LinkedHashMap<>();
        if (byLanguage != null) {
            byLanguage.forEach(
                    (language, code) -> {
                        String id = normalizeLanguage(language);
                        if (id == null || code == null || code.isBlank()) return;
                        if (id.length() > MAX_LANGUAGE_LENGTH) {
                            throw new ValidationException("dsa_solution_language_invalid");
                        }
                        normalized.put(id, stripTrailingWhitespace(code));
                    });
        }

        List<DsaSolutionDto> ordered = new ArrayList<>();
        normalized.forEach((language, code) -> ordered.add(new DsaSolutionDto(language, code)));
        ordered.sort(BY_LANGUAGE);

        try {
            return objectMapper.writeValueAsString(ordered);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialise approach solutions", e);
        }
    }

    /** The stored solutions. A malformed column reads as none rather than failing the page. */
    public List<DsaSolutionDto> read(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            List<DsaSolutionDto> parsed = objectMapper.readValue(json, SOLUTION_LIST);
            return parsed == null ? List.of() : parsed;
        } catch (JsonProcessingException e) {
            log.warn("Unreadable approach solutions, treating as empty: {}", e.getMessage());
            return List.of();
        }
    }

    public DsaApproachDto toDto(DsaApproach approach) {
        return new DsaApproachDto(
                approach.getId(),
                approach.getKind().name(),
                approach.getOrderIndex(),
                approach.getIntuition(),
                approach.getTimeComplexity(),
                approach.getSpaceComplexity(),
                read(approach.getSolutions()));
    }

    private static final Comparator<DsaSolutionDto> BY_LANGUAGE =
            Comparator.comparingInt((DsaSolutionDto s) -> rank(s.language()))
                    .thenComparing(DsaSolutionDto::language);

    private static int rank(String language) {
        int index = LANGUAGE_ORDER.indexOf(language);
        return index < 0 ? LANGUAGE_ORDER.size() : index;
    }

    /**
     * Trailing spaces and a trailing newline are invisible in an editor and show up as a blank last
     * line in the rendered code block.
     */
    private static String stripTrailingWhitespace(String code) {
        return code.replaceAll("[ \\t]+(?=\\r?\\n)", "").stripTrailing();
    }
}
