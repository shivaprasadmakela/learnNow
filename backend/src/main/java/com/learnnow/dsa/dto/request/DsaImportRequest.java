package com.learnnow.dsa.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;

/**
 * One step's worth of content, as authored in {@code content/dsa/step-NN-*.json}.
 *
 * <p>Matching is by slug all the way down, which is what makes a re-import safe: a step that
 * already exists is updated in place, so the problem rows keep their ids and every learner's
 * progress, notes and submissions stay attached. Nothing is ever deleted implicitly - a problem
 * dropped from the file is left alone rather than removed, because removing it would take a
 * learner's history with it.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DsaImportRequest(
        @NotBlank String sheetSlug,
        String sheetTitle,
        String sheetDescription,
        String playlistUrl,
        @Valid @NotEmpty List<ImportStep> steps) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportStep(
            @NotBlank String slug,
            Integer orderIndex,
            @NotBlank String title,
            String description,
            @Valid List<ImportSection> sections) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    /**
     * A grouping level. {@code sections} nests to any depth, and a section may carry both problems
     * and sub-sections - its problems render above its children.
     */
    public record ImportSection(
            String title,
            String description,
            Integer orderIndex,
            @Valid List<ImportProblem> problems,
            @Valid List<ImportSection> sections) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportProblem(
            @NotBlank String slug,
            @NotBlank String title,
            String statement,
            String difficulty,
            List<String> tags,
            Integer estimatedMinutes,
            @JsonAlias({"youtubeUrl", "videoUrl"}) String youtubeUrl,
            Integer youtubePosition,
            String practiceUrl,
            String practicePlatform,
            String status,
            List<String> hints,
            @Valid ImportCheck check,
            @Valid List<ImportApproach> approaches,
            /** Keyed by language id, matching the compiler's own language ids. */
            Map<String, ImportHarness> harnesses,
            @Valid List<ImportTestCase> testCases) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportApproach(
            String kind,
            String intuition,
            String timeComplexity,
            String spaceComplexity,
            String language,
            String code) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportHarness(String starterCode, String driverCode, String referenceSolution) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportTestCase(
            String input,
            @JsonAlias({"expectedOutput", "output"}) String expectedOutput,
            @JsonAlias({"isSample", "sample"}) Boolean isSample,
            String explanation) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportCheck(
            @NotBlank String prompt,
            List<String> options,
            @JsonAlias({"correctAnswer", "answer"}) String correctAnswer,
            String explanation,
            Integer points) {}
}
