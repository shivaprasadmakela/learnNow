package com.learnnow.dsa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.dto.response.DsaImportResultDto;
import com.learnnow.dsa.entity.*;
import com.learnnow.dsa.repository.*;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
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

    /**
     * Everything already stored that this import might touch, read once before the walk begins.
     *
     * <p>The walk used to ask the database about each problem as it reached it - does this slug
     * exist, what hints does it have, what approaches, what harnesses, what test cases - which is
     * around seven queries per problem before a single row was written. That is invisible against a
     * local database and ruinous against a remote one: the service runs in Mumbai and the database
     * in Singapore, so every one of those queries costs a ~63 ms round trip however trivial it is.
     * A 54-problem step took 62 seconds, and the cost was almost exactly linear in problem count.
     *
     * <p>Six queries now answer all of it, whatever the file contains. The queries themselves were
     * never the expense; their number was.
     */
    private record ExistingContent(
            Map<String, DsaProblem> problemsBySlug,
            Map<UUID, List<DsaHint>> hints,
            Map<UUID, List<DsaApproach>> approaches,
            Map<UUID, List<DsaCheck>> checks,
            Map<UUID, List<DsaHarness>> harnesses,
            Map<UUID, List<DsaTestCase>> testCases) {

        /**
         * A problem created by this import has nothing stored against it yet, so every lookup for
         * it is legitimately empty rather than unknown.
         */
        List<DsaHint> hintsFor(UUID problemId) {
            return hints.getOrDefault(problemId, List.of());
        }

        List<DsaApproach> approachesFor(UUID problemId) {
            return approaches.getOrDefault(problemId, List.of());
        }

        List<DsaCheck> checksFor(UUID problemId) {
            return checks.getOrDefault(problemId, List.of());
        }

        List<DsaHarness> harnessesFor(UUID problemId) {
            return harnesses.getOrDefault(problemId, List.of());
        }

        List<DsaTestCase> testCasesFor(UUID problemId) {
            return testCases.getOrDefault(problemId, List.of());
        }
    }

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
        // One lookup for the whole file, for the same reason the real import does it. A dry run
        // that takes a minute is a dry run nobody waits for.
        Map<String, DsaProblem> known = existingProblemsBySlug(request);

        for (DsaImportRequest.ImportStep step : request.steps()) {
            boolean stepExists =
                    sheet.flatMap(s -> stepRepository.findBySheetIdAndSlug(s.getId(), step.slug()))
                            .isPresent();
            if (stepExists) tally.stepsUpdated++;
            else tally.stepsCreated++;

            for (DsaImportRequest.ImportSection section : safe(step.sections())) {
                for (DsaImportRequest.ImportProblem problem : safe(section.problems())) {
                    if (known.containsKey(problem.slug())) {
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

    /** Every problem slug the file mentions, at any nesting depth. */
    private void collectProblemSlugs(
            List<DsaImportRequest.ImportSection> sections, List<String> into) {
        for (DsaImportRequest.ImportSection section : safe(sections)) {
            for (DsaImportRequest.ImportProblem problem : safe(section.problems())) {
                if (problem.slug() != null) into.add(problem.slug());
            }
            collectProblemSlugs(section.sections(), into);
        }
    }

    private List<String> problemSlugsIn(DsaImportRequest request) {
        List<String> slugs = new ArrayList<>();
        for (DsaImportRequest.ImportStep step : safe(request.steps())) {
            collectProblemSlugs(step.sections(), slugs);
        }
        return slugs;
    }

    /**
     * The problems the file names that already exist, keyed by slug. One query.
     *
     * <p>Split out because a dry run needs only this much: {@code validate} reports what would be
     * created and what updated, and never looks at hints, harnesses or test cases.
     */
    private Map<String, DsaProblem> existingProblemsBySlug(DsaImportRequest request) {
        List<String> slugs = problemSlugsIn(request);
        List<DsaProblem> problems =
                slugs.isEmpty() ? List.of() : problemRepository.findAllBySlugIn(slugs);

        // A slug is unique in the schema, so a duplicate here can only come from the file listing
        // the same problem twice. Keeping the first is arbitrary but stable - they are the same
        // row.
        return problems.stream()
                .collect(
                        Collectors.toMap(
                                DsaProblem::getSlug,
                                Function.identity(),
                                (first, second) -> first,
                                LinkedHashMap::new));
    }

    /** See {@link ExistingContent}. Six queries, regardless of how large the file is. */
    private ExistingContent loadExistingContent(DsaImportRequest request) {
        Map<String, DsaProblem> bySlug = existingProblemsBySlug(request);
        List<UUID> ids = bySlug.values().stream().map(DsaProblem::getId).toList();
        if (ids.isEmpty()) {
            // Nothing exists yet, so there is nothing to fetch. Skipping the five IN queries also
            // avoids handing the database an empty IN list.
            return new ExistingContent(bySlug, Map.of(), Map.of(), Map.of(), Map.of(), Map.of());
        }

        return new ExistingContent(
                bySlug,
                byProblem(
                        hintRepository.findByProblemIdInOrderByOrderIndexAsc(ids),
                        h -> h.getProblem().getId()),
                byProblem(
                        approachRepository.findByProblemIdInOrderByOrderIndexAsc(ids),
                        a -> a.getProblem().getId()),
                byProblem(
                        checkRepository.findByProblemIdInOrderByOrderIndexAsc(ids),
                        c -> c.getProblem().getId()),
                byProblem(harnessRepository.findByProblemIdIn(ids), h -> h.getProblem().getId()),
                byProblem(
                        testCaseRepository.findByProblemIdInOrderByOrderIndexAsc(ids),
                        t -> t.getProblem().getId()));
    }

    /**
     * Groups fetched children by their owning problem.
     *
     * <p>{@code getProblem().getId()} reads the identifier straight off the lazy proxy without
     * initialising it, so grouping costs no further queries. Fetching the parent here would undo
     * the point of the exercise.
     */
    private static <T> Map<UUID, List<T>> byProblem(
            Collection<T> rows, Function<T, UUID> problemIdOf) {
        Map<UUID, List<T>> grouped = new HashMap<>();
        for (T row : rows) {
            grouped.computeIfAbsent(problemIdOf.apply(row), id -> new ArrayList<>()).add(row);
        }
        return grouped;
    }

    @Transactional
    public DsaImportResultDto importContent(DsaImportRequest request) {
        Tally tally = new Tally();
        ExistingContent existing = loadExistingContent(request);

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

            // One read of the step's existing sections, shared by every level of the recursion
            // below, in place of a findSiblings per section.
            Map<UUID, List<DsaSection>> siblings =
                    byParent(sectionRepository.findByStepIdOrderByPathAsc(step.getId()));

            importSections(step, null, safe(importStep.sections()), siblings, existing, tally);
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
            Map<UUID, List<DsaSection>> siblingsByParent,
            ExistingContent existing,
            Tally tally) {

        int order = 0;
        for (DsaImportRequest.ImportSection source : sources) {
            order++;
            DsaSection section = upsertSection(step, parent, source, order, siblingsByParent);

            int problemOrder = 0;
            for (DsaImportRequest.ImportProblem importProblem : safe(source.problems())) {
                problemOrder++;
                upsertProblem(section, importProblem, problemOrder, existing, tally);
            }

            importSections(
                    step, section, safe(source.sections()), siblingsByParent, existing, tally);
        }
    }

    /** A step's existing sections, grouped by parent. The root sections sit under a null key. */
    private static Map<UUID, List<DsaSection>> byParent(List<DsaSection> sections) {
        Map<UUID, List<DsaSection>> grouped = new HashMap<>();
        for (DsaSection section : sections) {
            UUID parentId = section.getParent() == null ? null : section.getParent().getId();
            grouped.computeIfAbsent(parentId, id -> new ArrayList<>()).add(section);
        }
        return grouped;
    }

    private DsaSection upsertSection(
            DsaStep step,
            DsaSection parent,
            DsaImportRequest.ImportSection source,
            int fallbackOrder,
            Map<UUID, List<DsaSection>> siblingsByParent) {

        int order = source.orderIndex() != null ? source.orderIndex() : fallbackOrder;
        UUID parentId = parent == null ? null : parent.getId();

        // Matched among siblings, not across the whole step: two sub-sections under different
        // parents may both be the first of their group.
        DsaSection section =
                siblingsByParent.getOrDefault(parentId, List.of()).stream()
                        .filter(s -> s.getOrderIndex() == order)
                        .findFirst()
                        .orElse(null);

        if (section == null) {
            section = DsaSection.builder().step(step).parent(parent).orderIndex(order).build();
            // A section created here becomes a parent one level down, so the group it belongs to
            // has to know about it. The old code re-queried for this and still could not see it,
            // because it had not been flushed.
            siblingsByParent.computeIfAbsent(parentId, id -> new ArrayList<>()).add(section);
        }

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
            ExistingContent existing,
            Tally tally) {

        DsaProblem problem = existing.problemsBySlug().get(source.slug());
        if (problem == null) {
            problem = DsaProblem.builder().slug(source.slug()).build();
            tally.problemsCreated++;
        } else {
            tally.problemsUpdated++;
        }

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
        UUID problemId = saved.getId();
        // A file that lists the same slug twice used to find its own first pass on the second,
        // because every lookup went to the database. The working set has to learn about rows this
        // import creates, or the second mention would try to insert the slug again.
        existing.problemsBySlug().put(saved.getSlug(), saved);

        replaceHints(saved, source.hints(), existing.hintsFor(problemId));
        replaceApproaches(saved, source.approaches(), existing.approachesFor(problemId), tally);
        replaceCheck(saved, source.check(), existing.checksFor(problemId));
        upsertHarnesses(saved, source.harnesses(), existing.harnessesFor(problemId), tally);
        upsertTestCases(saved, source.testCases(), existing.testCasesFor(problemId), tally);
    }

    /**
     * Hints and approaches are pure editorial with nothing referencing them, so the JSON stays
     * authoritative: a set the file omits entirely is left alone, and a set it provides replaces
     * what was there. Test cases and harnesses are handled differently below - those are matched by
     * position so expected outputs already generated are not thrown away.
     *
     * <p>The rows are now rewritten in place rather than deleted and recreated, which removes the
     * reason this code used to flush. Deleting then inserting collided with {@code
     * uq_dsa_hints_problem_order}: Hibernate runs inserts before entity deletions, and the
     * application asks for ordered inserts on top of that, so the replacement row for position 1
     * reached the database while the original was still sitting there. The old fix was to flush
     * between the two, three times per problem, which on a remote database cost more than every
     * other write in the import put together. Reusing the row at each position makes the collision
     * impossible rather than racing it.
     */
    private void replaceHints(DsaProblem problem, List<String> hints, List<DsaHint> existing) {
        if (hints == null) return;

        Map<Integer, DsaHint> byOrder = new HashMap<>();
        for (DsaHint hint : existing) byOrder.put(hint.getOrderIndex(), hint);

        int order = 0;
        for (String body : hints) {
            if (body == null || body.isBlank()) continue;
            order++;
            DsaHint hint = byOrder.get(order);
            if (hint == null) {
                hint = DsaHint.builder().problem(problem).orderIndex(order).build();
            }
            hint.setBody(body);
            hintRepository.save(hint);
        }

        int kept = order;
        List<DsaHint> surplus =
                existing.stream().filter(hint -> hint.getOrderIndex() > kept).toList();
        if (!surplus.isEmpty()) hintRepository.deleteAll(surplus);
    }

    /** See {@link #replaceHints}: same position-matched replacement, more fields. */
    private void replaceApproaches(
            DsaProblem problem,
            List<DsaImportRequest.ImportApproach> approaches,
            List<DsaApproach> existing,
            Tally tally) {

        if (approaches == null) return;

        Map<Integer, DsaApproach> byOrder = new HashMap<>();
        for (DsaApproach approach : existing) byOrder.put(approach.getOrderIndex(), approach);

        int order = 0;
        for (DsaImportRequest.ImportApproach source : approaches) {
            order++;
            DsaApproach approach = byOrder.get(order);
            if (approach == null) {
                approach = DsaApproach.builder().problem(problem).orderIndex(order).build();
            }
            approach.setKind(parseApproachKind(source.kind(), tally, problem.getSlug()));
            approach.setIntuition(source.intuition() == null ? "" : source.intuition());
            approach.setTimeComplexity(source.timeComplexity());
            approach.setSpaceComplexity(source.spaceComplexity());
            approach.setLanguage(source.language());
            approach.setCode(source.code());
            approachRepository.save(approach);
        }

        int kept = order;
        List<DsaApproach> surplus =
                existing.stream().filter(approach -> approach.getOrderIndex() > kept).toList();
        if (!surplus.isEmpty()) approachRepository.deleteAll(surplus);
    }

    /** One check per problem, always at position 1. See {@link #replaceHints}. */
    private void replaceCheck(
            DsaProblem problem, DsaImportRequest.ImportCheck source, List<DsaCheck> existing) {

        if (source == null) return;

        DsaCheck check =
                existing.stream()
                        .filter(candidate -> candidate.getOrderIndex() == 1)
                        .findFirst()
                        .orElseGet(() -> DsaCheck.builder().problem(problem).orderIndex(1).build());

        check.setPrompt(source.prompt());
        check.setOptions(writeJson(source.options()));
        check.setCorrectAnswer(source.correctAnswer() == null ? "" : source.correctAnswer());
        check.setExplanation(source.explanation());
        check.setPoints(source.points() != null ? source.points() : 2);
        checkRepository.save(check);

        List<DsaCheck> surplus =
                existing.stream().filter(candidate -> candidate.getOrderIndex() != 1).toList();
        if (!surplus.isEmpty()) checkRepository.deleteAll(surplus);
    }

    private void upsertHarnesses(
            DsaProblem problem,
            Map<String, DsaImportRequest.ImportHarness> harnesses,
            List<DsaHarness> existing,
            Tally tally) {

        if (harnesses == null) return;

        Map<String, DsaHarness> byLanguage = new HashMap<>();
        for (DsaHarness harness : existing) {
            byLanguage.put(harness.getLanguage().toLowerCase(), harness);
        }

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

            DsaHarness harness = byLanguage.get(language.toLowerCase());
            if (harness == null) {
                harness =
                        DsaHarness.builder()
                                .problem(problem)
                                .language(language.toLowerCase())
                                .build();
            }
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
     *
     * <p>Cases the file no longer lists are kept, not deleted - the same as before. The count of
     * cases still missing an expected output is taken from the rows in hand rather than by reading
     * them back, which is what the old code did immediately after writing them.
     */
    private void upsertTestCases(
            DsaProblem problem,
            List<DsaImportRequest.ImportTestCase> cases,
            List<DsaTestCase> existing,
            Tally tally) {

        if (cases == null) return;

        Map<Integer, DsaTestCase> byOrder = new HashMap<>();
        for (DsaTestCase testCase : existing) byOrder.put(testCase.getOrderIndex(), testCase);

        // Every case the problem ends up with: the stored ones, which are updated in place, plus
        // any this file adds beyond them.
        List<DsaTestCase> allCases = new ArrayList<>(existing);

        int order = 0;
        for (DsaImportRequest.ImportTestCase source : cases) {
            order++;
            DsaTestCase testCase = byOrder.get(order);
            if (testCase == null) {
                testCase = DsaTestCase.builder().problem(problem).orderIndex(order).build();
                allCases.add(testCase);
            }

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
                allCases.stream()
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
