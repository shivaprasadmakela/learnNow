package com.learnnow.dsa.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Everything an author can change about one problem, in one request.
 *
 * <p>The collections are <em>tri-state</em>, and that is the whole design of this DTO: a null list
 * means "leave this alone", an empty list means "there are none of these now", and a populated list
 * replaces what is stored. Without that distinction the editor would have to send the full problem
 * on every keystroke-sized save, and a tab the author never opened would silently wipe the rows it
 * never loaded.
 *
 * <p>The slug is deliberately absent. It is what the learner-facing URL, every bookmark and the
 * import file all key on, so renaming it is a migration rather than an edit.
 */
public record DsaProblemUpdateRequest(
        @NotBlank @Size(max = 300) String title,
        @NotNull String statement,
        @NotBlank String difficulty,
        List<String> tags,
        Integer estimatedMinutes,
        String youtubeUrl,
        Integer youtubePosition,
        String practiceUrl,
        String practicePlatform,
        String status,
        List<@NotBlank String> hints,
        @Valid List<ApproachUpdate> approaches,
        @Valid List<TestCaseUpdate> testCases,
        @Valid List<CheckUpdate> checks,
        @Valid List<HarnessUpdate> harnesses) {

    /** One editorial write-up. {@code kind} is BRUTE, BETTER or OPTIMAL. */
    public record ApproachUpdate(
            @NotBlank String kind,
            @NotNull String intuition,
            String timeComplexity,
            String spaceComplexity,
            String language,
            String code) {}

    /**
     * One test case.
     *
     * <p>{@code expectedOutput} may be blank: a case can be authored before the generate-expected
     * pass has run the reference solution over it.
     */
    public record TestCaseUpdate(
            @NotNull String input, String expectedOutput, boolean sample, String explanation) {}

    /** The inline "now your turn" question. */
    public record CheckUpdate(
            @NotBlank String prompt,
            List<String> options,
            @NotNull String correctAnswer,
            String explanation,
            Integer points) {}

    /**
     * One language's harness. Validated the same way {@link DsaHarnessRequest} is, because a driver
     * without the placeholder produces a problem that compiles and judges nothing.
     */
    public record HarnessUpdate(
            @NotBlank String language,
            @NotNull String starterCode,
            @NotBlank String driverCode,
            String referenceSolution) {}
}
