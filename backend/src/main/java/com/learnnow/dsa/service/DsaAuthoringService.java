package com.learnnow.dsa.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.dsa.dto.request.DsaHarnessRequest;
import com.learnnow.dsa.dto.request.DsaProblemUpdateRequest;
import com.learnnow.dsa.dto.request.DsaSectionUpdateRequest;
import com.learnnow.dsa.dto.request.DsaStepUpdateRequest;
import com.learnnow.dsa.dto.response.*;
import com.learnnow.dsa.entity.*;
import com.learnnow.dsa.repository.*;
import com.learnnow.dsa.service.DsaExecutionService.CaseOutcome;
import com.learnnow.dsa.service.DsaExecutionService.ExecutionOutcome;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin-side reads and writes.
 *
 * <p>Separate DTOs from the learner-facing ones throughout. One shared DTO with a flag deciding
 * what to populate is how hidden test data eventually escapes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DsaAuthoringService {

    /**
     * An expectation no real output can equal, used when probing for actual output.
     *
     * <p>Generating expected outputs means running the reference solution and keeping whatever it
     * printed. Comparing against a value that cannot match keeps the comparison from
     * short-circuiting and guarantees every case reports its actual output.
     */
    private static final String NEVER_MATCHES = "\u0000never-matches";

    private final DsaSheetRepository sheetRepository;
    private final DsaStepRepository stepRepository;
    private final DsaSectionRepository sectionRepository;
    private final DsaProblemRepository problemRepository;
    private final DsaApproachRepository approachRepository;
    private final DsaHintRepository hintRepository;
    private final DsaHarnessRepository harnessRepository;
    private final DsaTestCaseRepository testCaseRepository;
    private final DsaCheckRepository checkRepository;
    private final DsaExecutionService executionService;
    private final ObjectMapper objectMapper;
    private final DsaApproachSolutions approachSolutions;

    @Transactional(readOnly = true)
    public PageResponse<AdminDsaSheetDto> listSheets(Pageable pageable) {
        Page<DsaSheet> page = sheetRepository.findAll(pageable);
        return PageResponse.of(page.map(this::toAdminSheetDto));
    }

    @Transactional(readOnly = true)
    public AdminDsaSheetDto sheetById(UUID sheetId) {
        return sheetRepository
                .findById(sheetId)
                .map(this::toAdminSheetDto)
                .orElseThrow(() -> new NotFoundException("dsa_sheet_not_found"));
    }

    @Transactional(readOnly = true)
    public AdminDsaProblemDto problemById(UUID problemId) {
        DsaProblem problem =
                problemRepository
                        .findById(problemId)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));
        return toAdminProblemDto(problem);
    }

    @Transactional
    public AdminDsaHarnessDto upsertHarness(
            UUID problemId, String language, DsaHarnessRequest request) {

        DsaProblem problem =
                problemRepository
                        .findById(problemId)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));

        if (!request.driverCode().contains(DsaHarness.USER_CODE_PLACEHOLDER)) {
            throw new ValidationException("dsa_driver_placeholder_missing");
        }
        if ("java".equalsIgnoreCase(language)
                && !request.driverCode().contains("public class Main")) {
            // CompilerSnippetService renames any other public class to Main before execution, which
            // would rewrite the driver out from under us.
            throw new ValidationException("dsa_java_driver_needs_main_class");
        }

        DsaHarness harness =
                harnessRepository
                        .findByProblemIdAndLanguageIgnoreCase(problemId, language)
                        .orElseGet(
                                () ->
                                        DsaHarness.builder()
                                                .problem(problem)
                                                .language(language.toLowerCase())
                                                .build());
        harness.setStarterCode(request.starterCode());
        harness.setDriverCode(request.driverCode());
        harness.setReferenceSolution(request.referenceSolution());
        DsaHarness saved = harnessRepository.save(harness);

        return new AdminDsaHarnessDto(
                saved.getId(),
                saved.getLanguage(),
                saved.getStarterCode(),
                saved.getDriverCode(),
                saved.getReferenceSolution());
    }

    /**
     * Fills in every expected output by running our reference solution through the same harness
     * path a learner's submission takes.
     *
     * <p>Without this, authoring a sheet means hand-computing the answer to several hundred test
     * cases, which is where a project like this actually stalls. Running the reference through the
     * identical code path also means a subtly wrong driver shows up here, rather than as a hundred
     * learners reporting that a correct solution fails.
     */
    @Transactional
    public DsaExpectedOutputResultDto generateExpectedOutputs(UUID problemId, String language) {
        DsaHarness harness =
                harnessRepository
                        .findByProblemIdAndLanguageIgnoreCase(problemId, language)
                        .orElseThrow(() -> new NotFoundException("dsa_harness_not_found"));

        if (harness.getReferenceSolution() == null || harness.getReferenceSolution().isBlank()) {
            return new DsaExpectedOutputResultDto(
                    language, 0, false, "This harness has no reference solution.", List.of());
        }

        List<DsaTestCase> cases = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId);
        if (cases.isEmpty()) {
            return new DsaExpectedOutputResultDto(
                    language, 0, false, "This problem has no test cases.", List.of());
        }

        // Probe copies, so whatever is already stored cannot influence the comparison. Marked as
        // samples so the outcome carries the actual output back for every case.
        List<DsaTestCase> probes = new ArrayList<>();
        for (DsaTestCase testCase : cases) {
            probes.add(
                    DsaTestCase.builder()
                            .orderIndex(testCase.getOrderIndex())
                            .input(testCase.getInput())
                            .expectedOutput(NEVER_MATCHES)
                            .sample(true)
                            .build());
        }

        ExecutionOutcome outcome =
                executionService.execute(
                        problemId, language, harness.getReferenceSolution(), probes);

        if (outcome.verdict() != DsaVerdict.ACCEPTED
                && outcome.verdict() != DsaVerdict.WRONG_ANSWER) {
            String reason =
                    outcome.compileOutput() != null
                            ? outcome.compileOutput()
                            : (outcome.stderr() != null
                                    ? outcome.stderr()
                                    : "Reference solution did not run: " + outcome.verdict());
            return new DsaExpectedOutputResultDto(language, 0, false, reason, List.of());
        }

        List<String> generated = new ArrayList<>();
        int written = 0;
        for (CaseOutcome result : outcome.cases()) {
            if (result.actual() == null) continue;
            String normalized = DsaOutputNormalizer.normalize(result.actual());
            generated.add(normalized);

            int index = result.caseNumber() - 1;
            if (index >= 0 && index < cases.size()) {
                cases.get(index).setExpectedOutput(normalized);
                testCaseRepository.save(cases.get(index));
                written++;
            }
        }

        return new DsaExpectedOutputResultDto(language, written, true, null, generated);
    }

    @Transactional
    public void publishProblem(UUID problemId) {
        DsaProblem problem =
                problemRepository
                        .findById(problemId)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));
        problem.setStatus(DsaProblemStatus.PUBLISHED);
        problemRepository.save(problem);
    }

    @Transactional
    public void publishSheet(UUID sheetId) {
        DsaSheet sheet =
                sheetRepository
                        .findById(sheetId)
                        .orElseThrow(() -> new NotFoundException("dsa_sheet_not_found"));
        sheet.setStatus(DsaProblemStatus.PUBLISHED);
        sheetRepository.save(sheet);
    }

    /**
     * Deletes one problem, and with it every learner's history of that problem.
     *
     * <p>Explicit and single-target on purpose: the importer never deletes, precisely so a dropped
     * line in a JSON file cannot do this by accident.
     */
    @Transactional
    public void deleteProblem(UUID problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new NotFoundException("dsa_problem_not_found");
        }
        problemRepository.deleteById(problemId);
    }

    /**
     * Rewrites one problem from the authoring modal.
     *
     * <p>Every child collection is replaced rather than merged, and the request's tri-state nulls
     * decide which ones are touched at all - see {@link DsaProblemUpdateRequest}. Replacement is
     * the right semantics here because the modal always holds the complete set for a tab it has
     * loaded, and a merge would leave no way to delete the last hint.
     *
     * <p>The exception is test cases, which are matched by position so that an expected output
     * already generated survives an edit to a neighbouring case's explanation. Regenerating every
     * expected output after a typo fix means another round of engine time.
     */
    @Transactional
    public AdminDsaProblemDto updateProblem(UUID problemId, DsaProblemUpdateRequest request) {
        DsaProblem problem =
                problemRepository
                        .findById(problemId)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));

        problem.setTitle(request.title().trim());
        problem.setStatement(request.statement());
        problem.setDifficulty(parseDifficulty(request.difficulty()));
        if (request.tags() != null) problem.setTags(writeJsonArray(request.tags()));
        if (request.estimatedMinutes() != null) {
            problem.setEstimatedMinutes(Math.max(1, request.estimatedMinutes()));
        }
        problem.setYoutubeUrl(blankToNull(request.youtubeUrl()));
        problem.setYoutubePosition(request.youtubePosition());
        problem.setPracticeUrl(blankToNull(request.practiceUrl()));
        problem.setPracticePlatform(blankToNull(request.practicePlatform()));
        if (request.status() != null && !request.status().isBlank()) {
            problem.setStatus(parseProblemStatus(request.status()));
        }
        DsaProblem saved = problemRepository.save(problem);

        replaceHints(saved, request.hints());
        replaceApproaches(saved, request.approaches());
        replaceChecks(saved, request.checks());
        syncTestCases(saved, request.testCases());
        syncHarnesses(saved, request.harnesses());

        return toAdminProblemDto(saved);
    }

    @Transactional
    public void updateSection(UUID sectionId, DsaSectionUpdateRequest request) {
        DsaSection section =
                sectionRepository
                        .findById(sectionId)
                        .orElseThrow(() -> new NotFoundException("dsa_section_not_found"));
        // Null and blank both clear it: an untitled section is what makes a step render flat.
        section.setTitle(blankToNull(request.title()));
        section.setDescription(blankToNull(request.description()));
        sectionRepository.save(section);
    }

    /**
     * Deletes one section, its whole subtree, and every problem in it.
     *
     * <p>Both cascades are real: {@code parent_section_id} and {@code section_id} are declared
     * {@code ON DELETE CASCADE}, and the entity mappings cascade too. Worth knowing before clicking
     * it on a section three levels up.
     */
    @Transactional
    public void deleteSection(UUID sectionId) {
        if (!sectionRepository.existsById(sectionId)) {
            throw new NotFoundException("dsa_section_not_found");
        }
        sectionRepository.deleteById(sectionId);
    }

    @Transactional
    public void updateStep(UUID stepId, DsaStepUpdateRequest request) {
        DsaStep step =
                stepRepository
                        .findById(stepId)
                        .orElseThrow(() -> new NotFoundException("dsa_step_not_found"));
        step.setTitle(request.title().trim());
        step.setDescription(blankToNull(request.description()));
        stepRepository.save(step);
    }

    /** Deletes a step and everything under it. See {@link #deleteSection} on what that means. */
    @Transactional
    public void deleteStep(UUID stepId) {
        if (!stepRepository.existsById(stepId)) {
            throw new NotFoundException("dsa_step_not_found");
        }
        stepRepository.deleteById(stepId);
    }

    /* ------------------------------------------------------------------ child collections */

    /**
     * Hints, approaches and checks are pure editorial with nothing referencing them, so replacing
     * the set wholesale keeps the modal authoritative.
     *
     * <p>Each of these flushes between the delete and the inserts. That is load-bearing, not
     * tidiness: Hibernate's action queue runs inserts before entity deletions, and the application
     * sets {@code hibernate.order_inserts=true} on top of that, so the new rows would collide with
     * the old ones on the {@code (problem_id, order_index)} unique index before the deletes ever
     * reached the database. The importer hit exactly this and carries the same flushes.
     */
    private void replaceHints(DsaProblem problem, List<String> hints) {
        if (hints == null) return;
        hintRepository.deleteAll(
                hintRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId()));
        hintRepository.flush();
        int order = 0;
        for (String body : hints) {
            if (body == null || body.isBlank()) continue;
            order++;
            hintRepository.save(
                    DsaHint.builder().problem(problem).orderIndex(order).body(body).build());
        }
    }

    private void replaceApproaches(
            DsaProblem problem, List<DsaProblemUpdateRequest.ApproachUpdate> approaches) {
        if (approaches == null) return;
        approachRepository.deleteAll(
                approachRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId()));
        approachRepository.flush();
        int order = 0;
        for (DsaProblemUpdateRequest.ApproachUpdate source : approaches) {
            order++;
            approachRepository.save(
                    DsaApproach.builder()
                            .problem(problem)
                            .kind(parseApproachKind(source.kind()))
                            .orderIndex(order)
                            .intuition(source.intuition() == null ? "" : source.intuition())
                            .timeComplexity(blankToNull(source.timeComplexity()))
                            .spaceComplexity(blankToNull(source.spaceComplexity()))
                            .solutions(approachSolutions.write(solutionsByLanguage(source)))
                            .build());
        }
    }

    private static Map<String, String> solutionsByLanguage(
            DsaProblemUpdateRequest.ApproachUpdate source) {
        Map<String, String> byLanguage = new LinkedHashMap<>();
        if (source.solutions() == null) return byLanguage;
        for (DsaProblemUpdateRequest.SolutionUpdate solution : source.solutions()) {
            String language = DsaApproachSolutions.normalizeLanguage(solution.language());
            if (language == null) continue;
            if (byLanguage.containsKey(language)) {
                throw new ValidationException("dsa_solution_language_duplicate");
            }
            byLanguage.put(language, solution.code());
        }
        return byLanguage;
    }

    private void replaceChecks(
            DsaProblem problem, List<DsaProblemUpdateRequest.CheckUpdate> checks) {
        if (checks == null) return;
        checkRepository.deleteAll(
                checkRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId()));
        checkRepository.flush();
        int order = 0;
        for (DsaProblemUpdateRequest.CheckUpdate source : checks) {
            order++;
            checkRepository.save(
                    DsaCheck.builder()
                            .problem(problem)
                            .orderIndex(order)
                            .prompt(source.prompt())
                            .options(writeJsonArray(source.options()))
                            .correctAnswer(source.correctAnswer())
                            .explanation(blankToNull(source.explanation()))
                            .points(source.points() == null ? 2 : source.points())
                            .build());
        }
    }

    /**
     * Matches test cases by position instead of replacing them.
     *
     * <p>A stored expected output is the product of an engine run, so throwing it away because the
     * author fixed a typo in case three's explanation would mean regenerating all of them. Rows
     * beyond the submitted list are deleted, and a submitted blank expected output leaves whatever
     * was generated in place - the generate pass fills those in, the modal does not clear them.
     */
    private void syncTestCases(
            DsaProblem problem, List<DsaProblemUpdateRequest.TestCaseUpdate> cases) {
        if (cases == null) return;

        List<DsaTestCase> existing =
                testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId());

        if (existing.size() > cases.size()) {
            testCaseRepository.deleteAll(existing.subList(cases.size(), existing.size()));
            testCaseRepository.flush();
        }

        for (int i = 0; i < cases.size(); i++) {
            DsaProblemUpdateRequest.TestCaseUpdate source = cases.get(i);
            DsaTestCase target =
                    i < existing.size()
                            ? existing.get(i)
                            : DsaTestCase.builder()
                                    .problem(problem)
                                    .orderIndex(i + 1)
                                    .expectedOutput("")
                                    .build();

            boolean inputChanged = !source.input().equals(target.getInput());
            target.setOrderIndex(i + 1);
            target.setInput(source.input());
            target.setSample(source.sample());
            target.setExplanation(blankToNull(source.explanation()));

            if (source.expectedOutput() != null && !source.expectedOutput().isBlank()) {
                target.setExpectedOutput(source.expectedOutput());
            } else if (inputChanged) {
                // The stored answer belonged to the old input. Keeping it would fail every correct
                // submission, so it is cleared and the generate pass has to run again.
                target.setExpectedOutput("");
            }

            testCaseRepository.save(target);
        }
    }

    /** Upserts per language, and deletes any harness the modal no longer lists. */
    private void syncHarnesses(
            DsaProblem problem, List<DsaProblemUpdateRequest.HarnessUpdate> harnesses) {
        if (harnesses == null) return;

        for (DsaProblemUpdateRequest.HarnessUpdate source : harnesses) {
            upsertHarness(
                    problem.getId(),
                    source.language(),
                    new DsaHarnessRequest(
                            source.starterCode(),
                            source.driverCode(),
                            blankToNull(source.referenceSolution())));
        }

        List<String> kept =
                harnesses.stream()
                        .map(h -> h.language().toLowerCase())
                        .collect(java.util.stream.Collectors.toList());
        for (DsaHarness stored : harnessRepository.findByProblemId(problem.getId())) {
            if (!kept.contains(stored.getLanguage().toLowerCase())) {
                harnessRepository.delete(stored);
            }
        }
    }

    /* ------------------------------------------------------------------ parsing */

    private DsaDifficulty parseDifficulty(String raw) {
        try {
            return DsaDifficulty.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("dsa_unknown_difficulty");
        }
    }

    private DsaProblemStatus parseProblemStatus(String raw) {
        try {
            return DsaProblemStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("dsa_unknown_status");
        }
    }

    private DsaApproachKind parseApproachKind(String raw) {
        try {
            return DsaApproachKind.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("dsa_unknown_approach_kind");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String writeJsonArray(List<String> values) {
        if (values == null || values.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            log.warn("Could not serialise list to JSON, storing empty array: {}", e.getMessage());
            return "[]";
        }
    }

    /** A problem's test-case tally, as the sheet view reports it. */
    private record ProblemCaseStats(int total, int missingExpected) {
        private static final ProblemCaseStats NONE = new ProblemCaseStats(0, 0);
    }

    /**
     * Test-case tallies for every problem in a sheet, from one query.
     *
     * <p>Grouped here rather than with a SQL {@code GROUP BY} so the blank test stays Java's {@code
     * isBlank} - see the repository method. One pass, one round trip.
     */
    private Map<UUID, ProblemCaseStats> caseStatsForSheet(UUID sheetId) {
        Map<UUID, int[]> tallies = new HashMap<>();
        for (Object[] row : testCaseRepository.findExpectedOutputsBySheetId(sheetId)) {
            String expectedOutput = (String) row[1];
            int[] tally = tallies.computeIfAbsent((UUID) row[0], id -> new int[2]);
            tally[0]++;
            if (expectedOutput == null || expectedOutput.isBlank()) tally[1]++;
        }
        Map<UUID, ProblemCaseStats> stats = new HashMap<>(tallies.size());
        tallies.forEach((id, tally) -> stats.put(id, new ProblemCaseStats(tally[0], tally[1])));
        return stats;
    }

    private Map<UUID, Integer> harnessCountsForSheet(UUID sheetId) {
        Map<UUID, Integer> counts = new HashMap<>();
        for (Object[] row : harnessRepository.countBySheetIdGroupedByProblem(sheetId)) {
            counts.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    /**
     * The whole sheet, as the authoring studio shows it.
     *
     * <p>The two tallies each row displays are fetched for the entire sheet up front, in two
     * queries. They used to be fetched per problem, which on a 61-problem sheet meant 122 round
     * trips to a database on another continent and a seven-second page. Nothing about the shape of
     * the response changed.
     */
    private AdminDsaSheetDto toAdminSheetDto(DsaSheet sheet) {
        Map<UUID, ProblemCaseStats> caseStats = caseStatsForSheet(sheet.getId());
        Map<UUID, Integer> harnessCounts = harnessCountsForSheet(sheet.getId());

        List<AdminDsaSheetDto.AdminDsaStepDto> steps = new ArrayList<>();

        for (DsaStep step : stepRepository.findBySheetIdOrderByOrderIndexAsc(sheet.getId())) {
            List<AdminDsaSheetDto.AdminDsaSectionDto> sections = new ArrayList<>();

            // Path order is tree order, so a nested section lands directly under its parent.
            for (DsaSection section : sectionRepository.findByStepIdOrderByPathAsc(step.getId())) {
                List<AdminDsaSheetDto.AdminDsaProblemRowDto> rows = new ArrayList<>();

                for (DsaProblem problem : section.getProblems()) {
                    ProblemCaseStats stats =
                            caseStats.getOrDefault(problem.getId(), ProblemCaseStats.NONE);
                    rows.add(
                            new AdminDsaSheetDto.AdminDsaProblemRowDto(
                                    problem.getId(),
                                    problem.getSlug(),
                                    problem.getTitle(),
                                    problem.getDifficulty().name(),
                                    problem.getStatus().name(),
                                    problem.getOrderIndex(),
                                    problem.getYoutubeUrl() != null
                                            && !problem.getYoutubeUrl().isBlank(),
                                    harnessCounts.getOrDefault(problem.getId(), 0),
                                    stats.total(),
                                    stats.missingExpected()));
                }

                sections.add(
                        new AdminDsaSheetDto.AdminDsaSectionDto(
                                section.getId(),
                                section.getParent() == null ? null : section.getParent().getId(),
                                section.getOrderIndex(),
                                section.getDepth(),
                                section.getTitle(),
                                section.getDescription(),
                                rows));
            }

            steps.add(
                    new AdminDsaSheetDto.AdminDsaStepDto(
                            step.getId(),
                            step.getSlug(),
                            step.getOrderIndex(),
                            step.getTitle(),
                            step.getDescription(),
                            sections));
        }

        return new AdminDsaSheetDto(
                sheet.getId(),
                sheet.getSlug(),
                sheet.getTitle(),
                sheet.getDescription(),
                sheet.getPlaylistUrl(),
                sheet.getStatus().name(),
                steps);
    }

    private AdminDsaProblemDto toAdminProblemDto(DsaProblem problem) {
        UUID id = problem.getId();

        List<DsaApproachDto> approaches =
                approachRepository.findByProblemIdOrderByOrderIndexAsc(id).stream()
                        .map(approachSolutions::toDto)
                        .toList();

        List<DsaHintDto> hints =
                hintRepository.findByProblemIdOrderByOrderIndexAsc(id).stream()
                        .map(h -> new DsaHintDto(h.getId(), h.getOrderIndex(), h.getBody()))
                        .toList();

        List<AdminDsaHarnessDto> harnesses =
                harnessRepository.findByProblemId(id).stream()
                        .map(
                                h ->
                                        new AdminDsaHarnessDto(
                                                h.getId(),
                                                h.getLanguage(),
                                                h.getStarterCode(),
                                                h.getDriverCode(),
                                                h.getReferenceSolution()))
                        .toList();

        List<AdminDsaTestCaseDto> cases =
                testCaseRepository.findByProblemIdOrderByOrderIndexAsc(id).stream()
                        .map(
                                tc ->
                                        new AdminDsaTestCaseDto(
                                                tc.getId(),
                                                tc.getOrderIndex(),
                                                tc.getInput(),
                                                tc.getExpectedOutput(),
                                                tc.isSample(),
                                                tc.getExplanation()))
                        .toList();

        List<AdminDsaCheckDto> checks =
                checkRepository.findByProblemIdOrderByOrderIndexAsc(id).stream()
                        .map(
                                c ->
                                        new AdminDsaCheckDto(
                                                c.getId(),
                                                c.getOrderIndex(),
                                                c.getPrompt(),
                                                readJsonArray(c.getOptions()),
                                                c.getCorrectAnswer(),
                                                c.getExplanation(),
                                                c.getPoints()))
                        .toList();

        return new AdminDsaProblemDto(
                id,
                problem.getSlug(),
                problem.getTitle(),
                problem.getStatement(),
                problem.getDifficulty().name(),
                readJsonArray(problem.getTags()),
                problem.getEstimatedMinutes(),
                problem.getYoutubeUrl(),
                problem.getYoutubePosition(),
                problem.getPracticeUrl(),
                problem.getPracticePlatform(),
                problem.getStatus().name(),
                problem.getSection().getId(),
                problem.getOrderIndex(),
                approaches,
                hints,
                harnesses,
                cases,
                checks);
    }

    private List<String> readJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.debug("Unreadable JSON array in DSA content: {}", e.getMessage());
            return List.of();
        }
    }
}
