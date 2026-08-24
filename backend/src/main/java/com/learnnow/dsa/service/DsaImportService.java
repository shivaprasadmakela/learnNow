package com.learnnow.dsa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.dto.response.DsaImportResultDto;
import com.learnnow.dsa.entity.*;
import com.learnnow.dsa.repository.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bulk content import, keyed on slug all the way down.
 *
 * <p>This is the one class in the module where getting it wrong is unrecoverable. Progress, notes
 * and submissions all reference {@code dsa_problems.id}; a delete-and-recreate import assigns fresh
 * ids and silently orphans every one of those rows. So a problem that already exists is <em>updated
 * in place</em> and keeps its id, which is what makes it safe to re-import a step next week with a
 * video URL filled in.
 *
 * <p>Nothing is ever deleted implicitly either. A problem dropped from the JSON is left alone
 * rather than removed, because removing it would take a learner's history with it. Deletion is an
 * explicit admin action on a single problem.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DsaImportService {

    private final DsaSheetRepository sheetRepository;
    private final DsaStepRepository stepRepository;
    private final DsaSectionRepository sectionRepository;
    private final DsaProblemRepository problemRepository;
    private final DsaApproachRepository approachRepository;
    private final DsaHintRepository hintRepository;
    private final DsaHarnessRepository harnessRepository;
    private final DsaTestCaseRepository testCaseRepository;
    private final DsaCheckRepository checkRepository;
    private final ObjectMapper objectMapper;

    /** Counters threaded through the walk, so the result can distinguish created from updated. */
    private static final class Tally {
        int stepsCreated;
        int stepsUpdated;
        int problemsCreated;
        int problemsUpdated;
        int harnessesWritten;
        int testCasesWritten;
        final List<String> warnings = new ArrayList<>();
    }

    /** Reports what an import would do, without writing anything. */
    @Transactional(readOnly = true)
    public DsaImportResultDto validate(DsaImportRequest request) {
        Tally tally = new Tally();
        Optional<DsaSheet> sheet = sheetRepository.findBySlug(request.sheetSlug());

        for (DsaImportRequest.ImportStep step : request.steps()) {
            boolean stepExists =
                    sheet.flatMap(s -> stepRepository.findBySheetIdAndSlug(s.getId(), step.slug()))
                            .isPresent();
            if (stepExists) tally.stepsUpdated++;
            else tally.stepsCreated++;

            for (DsaImportRequest.ImportSection section : safe(step.sections())) {
                for (DsaImportRequest.ImportProblem problem : safe(section.problems())) {
                    if (problemRepository.findBySlug(problem.slug()).isPresent()) {
                        tally.problemsUpdated++;
                    } else {
                        tally.problemsCreated++;
                    }
                    validateProblem(problem, tally);
                }
            }
        }

        return new DsaImportResultDto(
                sheet.map(DsaSheet::getId).orElse(null),
                request.sheetSlug(),
                tally.stepsCreated,
                tally.stepsUpdated,
                tally.problemsCreated,
                tally.problemsUpdated,
                tally.harnessesWritten,
                tally.testCasesWritten,
                tally.warnings);
    }

    @Transactional
    public DsaImportResultDto importContent(DsaImportRequest request) {
        Tally tally = new Tally();

        DsaSheet sheet =
                sheetRepository
                        .findBySlug(request.sheetSlug())
                        .orElseGet(
                                () ->
                                        sheetRepository.save(
                                                DsaSheet.builder()
                                                        .slug(request.sheetSlug())
                                                        .title(
                                                                request.sheetTitle() != null
                                                                        ? request.sheetTitle()
                                                                        : request.sheetSlug())
                                                        .status(DsaProblemStatus.PUBLISHED)
                                                        .build()));

        if (request.sheetTitle() != null) sheet.setTitle(request.sheetTitle());
        if (request.sheetDescription() != null) sheet.setDescription(request.sheetDescription());
        if (request.playlistUrl() != null) sheet.setPlaylistUrl(request.playlistUrl());
        sheetRepository.save(sheet);

        int stepOrder = 0;
        for (DsaImportRequest.ImportStep importStep : request.steps()) {
            stepOrder++;
            DsaStep step = upsertStep(sheet, importStep, stepOrder, tally);

            importSections(step, null, safe(importStep.sections()), tally);
        }

        return new DsaImportResultDto(
                sheet.getId(),
                sheet.getSlug(),
                tally.stepsCreated,
                tally.stepsUpdated,
                tally.problemsCreated,
                tally.problemsUpdated,
                tally.harnessesWritten,
                tally.testCasesWritten,
                tally.warnings);
    }

    private DsaStep upsertStep(
            DsaSheet sheet, DsaImportRequest.ImportStep source, int fallbackOrder, Tally tally) {

        Optional<DsaStep> existing =
                stepRepository.findBySheetIdAndSlug(sheet.getId(), source.slug());
        DsaStep step =
                existing.orElseGet(
                        () -> DsaStep.builder().sheet(sheet).slug(source.slug()).build());

        if (existing.isPresent()) tally.stepsUpdated++;
        else tally.stepsCreated++;

        step.setTitle(source.title());
        step.setDescription(source.description());
        step.setOrderIndex(source.orderIndex() != null ? source.orderIndex() : fallbackOrder);
        return stepRepository.save(step);
    }

    /**
     * Sections are matched by position rather than slug, because they have none and their titles
     * are editorial prose that gets reworded. Position is stable in practice: the JSON lists them
     * in order and reordering sections is a deliberate act.
     */
    /**
     * Walks one level of sections and recurses into their children.
     *
     * <p>Depth is whatever the JSON nests to; nothing here caps it. A section's problems are
     * imported before its sub-sections so that a section carrying both keeps that reading order.
     */
    private void importSections(
            DsaStep step,
            DsaSection parent,
            List<DsaImportRequest.ImportSection> sources,
            Tally tally) {

        int order = 0;
        for (DsaImportRequest.ImportSection source : sources) {
            order++;
            DsaSection section = upsertSection(step, parent, source, order);

            int problemOrder = 0;
            for (DsaImportRequest.ImportProblem importProblem : safe(source.problems())) {
                problemOrder++;
                upsertProblem(section, importProblem, problemOrder, tally);
            }

            importSections(step, section, safe(source.sections()), tally);
        }
    }

    private DsaSection upsertSection(
            DsaStep step,
            DsaSection parent,
            DsaImportRequest.ImportSection source,
            int fallbackOrder) {

        int order = source.orderIndex() != null ? source.orderIndex() : fallbackOrder;

        // Matched among siblings, not across the whole step: two sub-sections under different
        // parents may both be the first of their group.
        DsaSection section =
                sectionRepository
                        .findSiblings(step.getId(), parent == null ? null : parent.getId())
                        .stream()
                        .filter(s -> s.getOrderIndex() == order)
                        .findFirst()
                        .orElseGet(
                                () ->
                                        DsaSection.builder()
                                                .step(step)
                                                .parent(parent)
                                                .orderIndex(order)
                                                .build());

        section.setParent(parent);
        section.setTitle(source.title());
        section.setDescription(source.description());
        section.setDepth(parent == null ? 0 : parent.getDepth() + 1);
        // The materialised sort key: the parent's path plus this section's own position. Recomputed
        // on every import so a moved section's descendants are re-sorted with it.
        section.setPath(
                (parent == null ? "" : parent.getPath() + ".") + String.format("%03d", order));
        return sectionRepository.save(section);
    }

    private void upsertProblem(
            DsaSection section,
            DsaImportRequest.ImportProblem source,
            int fallbackOrder,
            Tally tally) {

        Optional<DsaProblem> existing = problemRepository.findBySlug(source.slug());
        DsaProblem problem =
                existing.orElseGet(() -> DsaProblem.builder().slug(source.slug()).build());

        if (existing.isPresent()) tally.problemsUpdated++;
        else tally.problemsCreated++;

        problem.setSection(section);
        problem.setTitle(source.title());
        problem.setOrderIndex(fallbackOrder);
        if (source.statement() != null) problem.setStatement(source.statement());
        problem.setDifficulty(parseDifficulty(source.difficulty(), tally, source.slug()));
        problem.setTags(writeJson(source.tags()));
        if (source.estimatedMinutes() != null) {
            problem.setEstimatedMinutes(source.estimatedMinutes());
        }
        if (source.youtubeUrl() != null) problem.setYoutubeUrl(source.youtubeUrl());
        if (source.youtubePosition() != null) problem.setYoutubePosition(source.youtubePosition());
        if (source.practiceUrl() != null) problem.setPracticeUrl(source.practiceUrl());
        if (source.practicePlatform() != null) {
            problem.setPracticePlatform(source.practicePlatform());
        }
        problem.setStatus(parseStatus(source.status()));

        DsaProblem saved = problemRepository.save(problem);

        replaceHints(saved, source.hints());
        replaceApproaches(saved, source.approaches(), tally);
        replaceCheck(saved, source.check());
        upsertHarnesses(saved, source.harnesses(), tally);
        upsertTestCases(saved, source.testCases(), tally);
    }

    /**
     * Hints and approaches are pure editorial with nothing referencing them, so replacing the set
     * wholesale is safe and keeps the JSON authoritative. Test cases and harnesses are handled
     * differently below - those are matched by position so expected outputs already generated are
     * not thrown away.
     */
    private void replaceHints(DsaProblem problem, List<String> hints) {
        if (hints == null) return;
        hintRepository.deleteAll(
                hintRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId()));
        // The flush is required, not tidiness. Hibernate's action queue runs inserts before
        // entity deletions, and the application sets hibernate.order_inserts=true on top of
        // that -- so on a re-import the new rows would collide with the old ones on
        // uq_dsa_hints_problem_order before the deletes ever reached the database.
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
            DsaProblem problem, List<DsaImportRequest.ImportApproach> approaches, Tally tally) {
        if (approaches == null) return;
        approachRepository.deleteAll(
                approachRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId()));
        // See replaceHints: inserts flush before deletes, so uq_dsa_approaches_problem_order
        // would fire on a re-import without this.
        approachRepository.flush();
        int order = 0;
        for (DsaImportRequest.ImportApproach source : approaches) {
            order++;
            approachRepository.save(
                    DsaApproach.builder()
                            .problem(problem)
                            .kind(parseApproachKind(source.kind(), tally, problem.getSlug()))
                            .orderIndex(order)
                            .intuition(source.intuition() == null ? "" : source.intuition())
                            .timeComplexity(source.timeComplexity())
                            .spaceComplexity(source.spaceComplexity())
                            .language(source.language())
                            .code(source.code())
                            .build());
        }
    }

    private void replaceCheck(DsaProblem problem, DsaImportRequest.ImportCheck source) {
        if (source == null) return;
        checkRepository.deleteAll(
                checkRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId()));
        // See replaceHints: uq_dsa_checks_problem_order would fire on a re-import without this.
        checkRepository.flush();
        checkRepository.save(
                DsaCheck.builder()
                        .problem(problem)
                        .orderIndex(1)
                        .prompt(source.prompt())
                        .options(writeJson(source.options()))
                        .correctAnswer(source.correctAnswer() == null ? "" : source.correctAnswer())
                        .explanation(source.explanation())
                        .points(source.points() != null ? source.points() : 2)
                        .build());
    }

    private void upsertHarnesses(
            DsaProblem problem,
            Map<String, DsaImportRequest.ImportHarness> harnesses,
            Tally tally) {

        if (harnesses == null) return;
        for (Map.Entry<String, DsaImportRequest.ImportHarness> entry : harnesses.entrySet()) {
            String language = entry.getKey();
            DsaImportRequest.ImportHarness source = entry.getValue();
            if (source == null || source.driverCode() == null || source.starterCode() == null) {
                tally.warnings.add(
                        problem.getSlug()
                                + ": harness for "
                                + language
                                + " is incomplete, skipped");
                continue;
            }
            if (!source.driverCode().contains(DsaHarness.USER_CODE_PLACEHOLDER)) {
                tally.warnings.add(
                        problem.getSlug()
                                + ": "
                                + language
                                + " driver has no "
                                + DsaHarness.USER_CODE_PLACEHOLDER
                                + " placeholder, skipped");
                continue;
            }
            if ("java".equalsIgnoreCase(language)
                    && !source.driverCode().contains("public class Main")) {
                // CompilerSnippetService.prepareJavaSourceCode renames any other public class to
                // Main, which would rewrite the driver out from under us.
                tally.warnings.add(
                        problem.getSlug()
                                + ": java driver must declare 'public class Main' as its entry"
                                + " point, skipped");
                continue;
            }

            DsaHarness harness =
                    harnessRepository
                            .findByProblemIdAndLanguageIgnoreCase(problem.getId(), language)
                            .orElseGet(
                                    () ->
                                            DsaHarness.builder()
                                                    .problem(problem)
                                                    .language(language.toLowerCase())
                                                    .build());
            harness.setStarterCode(source.starterCode());
            harness.setDriverCode(source.driverCode());
            if (source.referenceSolution() != null) {
                harness.setReferenceSolution(source.referenceSolution());
            }
            harnessRepository.save(harness);
            tally.harnessesWritten++;
        }
    }

    /**
     * Test cases are matched by position, and a blank {@code expectedOutput} in the JSON does not
     * overwrite one already stored. That is what lets the generate-expected-output action run once
     * and survive every later re-import of the same file.
     */
    private void upsertTestCases(
            DsaProblem problem, List<DsaImportRequest.ImportTestCase> cases, Tally tally) {

        if (cases == null) return;

        Map<Integer, DsaTestCase> existing = new HashMap<>();
        for (DsaTestCase testCase :
                testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId())) {
            existing.put(testCase.getOrderIndex(), testCase);
        }

        int order = 0;
        for (DsaImportRequest.ImportTestCase source : cases) {
            order++;
            DsaTestCase testCase =
                    existing.getOrDefault(
                            order,
                            DsaTestCase.builder().problem(problem).orderIndex(order).build());

            testCase.setInput(source.input() == null ? "" : source.input());
            if (source.expectedOutput() != null && !source.expectedOutput().isBlank()) {
                testCase.setExpectedOutput(source.expectedOutput());
            } else if (testCase.getExpectedOutput() == null) {
                testCase.setExpectedOutput("");
            }
            testCase.setSample(Boolean.TRUE.equals(source.isSample()));
            testCase.setExplanation(source.explanation());
            testCaseRepository.save(testCase);
            tally.testCasesWritten++;
        }

        long missing =
                testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId()).stream()
                        .filter(
                                tc ->
                                        tc.getExpectedOutput() == null
                                                || tc.getExpectedOutput().isBlank())
                        .count();
        if (missing > 0) {
            tally.warnings.add(
                    problem.getSlug()
                            + ": "
                            + missing
                            + " case(s) have no expected output yet - run generate-expected before"
                            + " publishing");
        }
    }

    private void validateProblem(DsaImportRequest.ImportProblem problem, Tally tally) {
        if (problem.statement() == null || problem.statement().isBlank()) {
            tally.warnings.add(problem.slug() + ": no statement");
        }
        if (problem.harnesses() == null || problem.harnesses().isEmpty()) {
            tally.warnings.add(problem.slug() + ": no harness, so Run and Submit stay hidden");
        }
        if (problem.testCases() == null || problem.testCases().isEmpty()) {
            tally.warnings.add(problem.slug() + ": no test cases");
        }
        if (problem.youtubeUrl() == null || problem.youtubeUrl().isBlank()) {
            tally.warnings.add(problem.slug() + ": no video yet");
        }
    }

    private DsaDifficulty parseDifficulty(String raw, Tally tally, String slug) {
        if (raw == null) return DsaDifficulty.EASY;
        try {
            return DsaDifficulty.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            tally.warnings.add(slug + ": unknown difficulty '" + raw + "', defaulted to EASY");
            return DsaDifficulty.EASY;
        }
    }

    private DsaApproachKind parseApproachKind(String raw, Tally tally, String slug) {
        if (raw == null) return DsaApproachKind.OPTIMAL;
        try {
            return DsaApproachKind.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            tally.warnings.add(
                    slug + ": unknown approach kind '" + raw + "', defaulted to OPTIMAL");
            return DsaApproachKind.OPTIMAL;
        }
    }

    private DsaProblemStatus parseStatus(String raw) {
        if (raw == null) return DsaProblemStatus.DRAFT;
        try {
            return DsaProblemStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return DsaProblemStatus.DRAFT;
        }
    }

    private String writeJson(List<String> values) {
        if (values == null || values.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            log.warn("Could not serialise list to JSON, storing empty array: {}", e.getMessage());
            return "[]";
        }
    }

    private static <T> List<T> safe(List<T> list) {
        return list == null ? List.of() : list;
    }
}
