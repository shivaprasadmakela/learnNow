package com.learnnow.dsa.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.common.dto.PageResponse;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.dsa.dao.DsaProblemSearchDao;
import com.learnnow.dsa.dao.DsaProgressDao;
import com.learnnow.dsa.dto.response.*;
import com.learnnow.dsa.entity.*;
import com.learnnow.dsa.repository.*;
import com.learnnow.notes.service.NotesService;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The public read model for the sheet.
 *
 * <p>Every aggregate count here comes from a grouped query in {@link DsaProgressDao} rather than a
 * loop over steps. The course catalogue's equivalent reloads a user's whole progress set once per
 * path, and the sheet page needs solved-of-total for eighteen steps at once, so the same shape
 * would be considerably worse.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DsaCatalogService {

    private final DsaSheetRepository sheetRepository;
    private final DsaStepRepository stepRepository;
    private final DsaProblemRepository problemRepository;
    private final DsaApproachRepository approachRepository;
    private final DsaHintRepository hintRepository;
    private final DsaHarnessRepository harnessRepository;
    private final DsaTestCaseRepository testCaseRepository;
    private final DsaCheckRepository checkRepository;
    private final UserDsaProblemProgressRepository progressRepository;
    private final DsaProgressDao progressDao;
    private final DsaProblemSearchDao searchDao;
    private final NotesService notesService;
    private final ObjectMapper objectMapper;
    private final DsaApproachSolutions approachSolutions;

    @Transactional(readOnly = true)
    public PageResponse<DsaSheetSummaryDto> listSheets(String userId, Pageable pageable) {
        Page<DsaSheet> page = sheetRepository.findByStatus(DsaProblemStatus.PUBLISHED, pageable);

        List<DsaSheetSummaryDto> content = new ArrayList<>();
        for (DsaSheet sheet : page.getContent()) {
            long total =
                    problemRepository.countBySheetIdAndStatus(
                            sheet.getId(), DsaProblemStatus.PUBLISHED);
            long solved =
                    progressDao.solvedCountPerStep(userId, sheet.getId()).values().stream()
                            .mapToLong(Long::longValue)
                            .sum();
            content.add(
                    new DsaSheetSummaryDto(
                            sheet.getId(),
                            sheet.getSlug(),
                            sheet.getTitle(),
                            sheet.getDescription(),
                            sheet.getPlaylistUrl(),
                            total,
                            solved));
        }
        return PageResponse.of(content, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public DsaSheetDetailDto sheetBySlug(String slug, String userId) {
        DsaSheet sheet =
                sheetRepository
                        .findBySlugAndStatus(slug, DsaProblemStatus.PUBLISHED)
                        .orElseThrow(() -> new NotFoundException("dsa_sheet_not_found"));

        Map<UUID, Long> totals = progressDao.totalCountPerStep(sheet.getId());
        Map<UUID, Long> solved = progressDao.solvedCountPerStep(userId, sheet.getId());

        List<DsaStepDto> steps = new ArrayList<>();
        for (DsaStep step : stepRepository.findBySheetIdOrderByOrderIndexAsc(sheet.getId())) {
            steps.add(
                    new DsaStepDto(
                            step.getId(),
                            step.getSlug(),
                            step.getOrderIndex(),
                            step.getTitle(),
                            step.getDescription(),
                            totals.getOrDefault(step.getId(), 0L),
                            solved.getOrDefault(step.getId(), 0L)));
        }

        Map<String, Long> totalByDifficulty = new HashMap<>();
        for (Object[] row :
                problemRepository.countBySheetIdGroupedByDifficulty(
                        sheet.getId(), DsaProblemStatus.PUBLISHED)) {
            totalByDifficulty.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }

        long totalProblems = totalByDifficulty.values().stream().mapToLong(Long::longValue).sum();
        long solvedProblems = solved.values().stream().mapToLong(Long::longValue).sum();

        return new DsaSheetDetailDto(
                sheet.getId(),
                sheet.getSlug(),
                sheet.getTitle(),
                sheet.getDescription(),
                sheet.getPlaylistUrl(),
                totalProblems,
                solvedProblems,
                totalByDifficulty,
                progressDao.solvedCountPerDifficulty(userId, sheet.getId()),
                steps);
    }

    @Transactional(readOnly = true)
    public PageResponse<DsaProblemRowDto> problemsForStep(
            UUID stepId, String userId, Pageable pageable) {

        Page<DsaProblem> page =
                problemRepository.findByStepIdAndStatus(
                        stepId, DsaProblemStatus.PUBLISHED, pageable);

        return PageResponse.of(
                toRows(page.getContent(), userId), pageable, page.getTotalElements());
    }

    /**
     * One page of the sheet's problems matching a search, across every step.
     *
     * <p>The rows are the step endpoint's rows, built by the same code, so the sheet page can file
     * them under its step accordions exactly as if each step had been opened. Problems are loaded
     * with their section and step in the same query, since every row needs both.
     *
     * @param difficulty {@code EASY}, {@code MEDIUM} or {@code HARD}; blank or {@code ALL} for any
     * @param status {@code ALL}, {@code TODO}, {@code SOLVED} or {@code BOOKMARKED}
     * @throws ValidationException for a difficulty or status outside those
     */
    @Transactional(readOnly = true)
    public PageResponse<DsaProblemRowDto> searchSheet(
            String slug,
            String userId,
            String query,
            String difficulty,
            String status,
            Pageable pageable) {

        DsaSheet sheet =
                sheetRepository
                        .findBySlugAndStatus(slug, DsaProblemStatus.PUBLISHED)
                        .orElseThrow(() -> new NotFoundException("dsa_sheet_not_found"));

        DsaProblemSearchDao.Criteria criteria =
                new DsaProblemSearchDao.Criteria(
                        query, parseDifficulty(difficulty), parseStatusFilter(status));

        Page<UUID> ids = searchDao.search(sheet.getId(), userId, criteria, pageable);
        if (ids.isEmpty()) {
            return PageResponse.of(List.of(), pageable, ids.getTotalElements());
        }

        Map<UUID, DsaProblem> byId = new HashMap<>();
        for (DsaProblem problem : problemRepository.findAllWithSectionByIdIn(ids.getContent())) {
            byId.put(problem.getId(), problem);
        }
        List<DsaProblem> ordered =
                ids.getContent().stream().map(byId::get).filter(p -> p != null).toList();

        return PageResponse.of(toRows(ordered, userId), pageable, ids.getTotalElements());
    }

    private static DsaDifficulty parseDifficulty(String raw) {
        if (raw == null || raw.isBlank() || raw.equalsIgnoreCase("ALL")) return null;
        try {
            return DsaDifficulty.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ValidationException("dsa_difficulty_invalid");
        }
    }

    private static DsaProblemSearchDao.StatusFilter parseStatusFilter(String raw) {
        if (raw == null || raw.isBlank()) return DsaProblemSearchDao.StatusFilter.ALL;
        try {
            return DsaProblemSearchDao.StatusFilter.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ValidationException("dsa_status_filter_invalid");
        }
    }

    /** Rows for a page of problems, with progress and bookmarks read once for the whole page. */
    private List<DsaProblemRowDto> toRows(List<DsaProblem> problems, String userId) {
        List<UUID> problemIds = problems.stream().map(DsaProblem::getId).toList();
        Map<UUID, UserDsaProblemProgress> progressByProblem = loadProgress(userId, problemIds);
        // One query for the whole page rather than one per row.
        Set<UUID> bookmarked = notesService.bookmarkedProblemIds(userId, problemIds);

        List<DsaProblemRowDto> rows = new ArrayList<>();
        for (DsaProblem problem : problems) {
            UserDsaProblemProgress progress = progressByProblem.get(problem.getId());
            rows.add(
                    new DsaProblemRowDto(
                            problem.getId(),
                            problem.getSection().getStep().getId(),
                            problem.getSlug(),
                            problem.getTitle(),
                            problem.getDifficulty().name(),
                            problem.getEstimatedMinutes(),
                            readTags(problem.getTags()),
                            problem.getYoutubeUrl() != null && !problem.getYoutubeUrl().isBlank(),
                            problem.getPracticeUrl(),
                            problem.getPracticePlatform(),
                            sectionPath(problem.getSection()),
                            progress == null
                                    ? DsaProgressStatus.NOT_STARTED.name()
                                    : progress.getStatus().name(),
                            bookmarked.contains(problem.getId())));
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public DsaProblemDetailDto problemById(UUID problemId, String userId) {
        DsaProblem problem =
                problemRepository
                        .findById(problemId)
                        .filter(p -> p.getStatus() == DsaProblemStatus.PUBLISHED)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));
        return assembleDetail(problem, userId);
    }

    /**
     * The learner-shaped detail for any problem, published or not.
     *
     * <p>Only the authoring endpoint calls this. It exists so the admin preview renders the real
     * learner view rather than a second rendering of the same content built from admin DTOs - a
     * preview that goes through different code is a preview of something other than what ships.
     *
     * <p>Note what it does <em>not</em> relax: the DTO is still {@link DsaProblemDetailDto}, so
     * driver code, reference solutions and hidden expected output have no field to travel in.
     */
    @Transactional(readOnly = true)
    public DsaProblemDetailDto previewById(UUID problemId, String userId) {
        DsaProblem problem =
                problemRepository
                        .findById(problemId)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));
        return assembleDetail(problem, userId);
    }

    @Transactional(readOnly = true)
    public DsaProblemDetailDto problemBySlug(String slug, String userId) {
        DsaProblem problem =
                problemRepository
                        .findBySlugAndStatus(slug, DsaProblemStatus.PUBLISHED)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));
        return assembleDetail(problem, userId);
    }

    /**
     * The {@code n}th hint of a published problem, counting from one.
     *
     * <p>One at a time, because that is how the page reveals them: a learner who needed only the
     * first nudge is never sent the rest.
     */
    @Transactional(readOnly = true)
    public DsaHintDto hint(UUID problemId, int n) {
        requirePublished(problemId);
        return nthHint(problemId, n);
    }

    /** The full editorial of a published problem: intuition, complexity and code. */
    @Transactional(readOnly = true)
    public DsaEditorialDto editorial(UUID problemId) {
        requirePublished(problemId);
        return editorialOf(problemId);
    }

    /** {@link #hint} for the authoring preview, which serves drafts too. */
    @Transactional(readOnly = true)
    public DsaHintDto previewHint(UUID problemId, int n) {
        requireExists(problemId);
        return nthHint(problemId, n);
    }

    /** {@link #editorial} for the authoring preview, which serves drafts too. */
    @Transactional(readOnly = true)
    public DsaEditorialDto previewEditorial(UUID problemId) {
        requireExists(problemId);
        return editorialOf(problemId);
    }

    private DsaHintDto nthHint(UUID problemId, int n) {
        if (n < 1) throw new NotFoundException("dsa_hint_not_found");
        return hintRepository
                .findByProblemIdOrderByOrderIndexAsc(problemId, PageRequest.of(n - 1, 1))
                .stream()
                .findFirst()
                .map(h -> new DsaHintDto(h.getId(), h.getOrderIndex(), h.getBody()))
                .orElseThrow(() -> new NotFoundException("dsa_hint_not_found"));
    }

    private DsaEditorialDto editorialOf(UUID problemId) {
        return new DsaEditorialDto(
                problemId,
                approachRepository.findByProblemIdOrderByOrderIndexAsc(problemId).stream()
                        .map(approachSolutions::toDto)
                        .toList());
    }

    private void requirePublished(UUID problemId) {
        problemRepository
                .findById(problemId)
                .filter(p -> p.getStatus() == DsaProblemStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));
    }

    private void requireExists(UUID problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new NotFoundException("dsa_problem_not_found");
        }
    }

    private DsaProblemDetailDto assembleDetail(DsaProblem problem, String userId) {

        UUID problemId = problem.getId();
        DsaStep step = problem.getSection().getStep();

        List<DsaTestCaseDto> samples =
                testCaseRepository
                        .findByProblemIdAndSampleTrueOrderByOrderIndexAsc(problemId)
                        .stream()
                        .map(
                                tc ->
                                        new DsaTestCaseDto(
                                                tc.getId(),
                                                tc.getOrderIndex(),
                                                tc.getInput(),
                                                tc.getExpectedOutput(),
                                                tc.getExplanation()))
                        .toList();

        // Only the outline of the hints and the editorial. Their text comes from hint() and
        // editorial() when the learner asks for it, so nobody is sent the answer along with the
        // statement.
        int hintCount = (int) hintRepository.countByProblemId(problemId);

        List<DsaApproachSummaryDto> approaches =
                approachRepository.findSummariesByProblemId(problemId).stream()
                        .map(
                                a ->
                                        new DsaApproachSummaryDto(
                                                a.getId(),
                                                a.getKind().name(),
                                                a.getOrderIndex(),
                                                a.getTimeComplexity(),
                                                a.getSpaceComplexity()))
                        .toList();

        List<DsaCheckDto> checks =
                checkRepository.findByProblemIdOrderByOrderIndexAsc(problemId).stream()
                        .map(
                                c ->
                                        new DsaCheckDto(
                                                c.getId(),
                                                c.getOrderIndex(),
                                                c.getPrompt(),
                                                readTags(c.getOptions())))
                        .toList();

        // Only the stub half of each harness. The driver and reference solution have no field on
        // this DTO at all, so they cannot be leaked by forgetting to strip them.
        List<DsaHarnessStubDto> harnesses =
                harnessRepository.findByProblemId(problemId).stream()
                        .map(h -> new DsaHarnessStubDto(h.getLanguage(), h.getStarterCode()))
                        .toList();

        int totalCases = (int) testCaseRepository.countByProblemId(problemId);
        boolean judgeable = !harnesses.isEmpty() && totalCases > 0;

        List<DsaProblemRepository.SlugRef> siblings =
                problemRepository.findSlugsByStepIdAndStatus(
                        step.getId(), DsaProblemStatus.PUBLISHED);
        String previousSlug = null;
        String nextSlug = null;
        for (int i = 0; i < siblings.size(); i++) {
            if (siblings.get(i).getId().equals(problemId)) {
                if (i > 0) previousSlug = siblings.get(i - 1).getSlug();
                if (i < siblings.size() - 1) nextSlug = siblings.get(i + 1).getSlug();
                break;
            }
        }

        DsaProblemProgressDto progress = DsaProblemProgressDto.notStarted();
        boolean bookmarked = false;
        if (userId != null && !userId.isBlank()) {
            // The lookup the sheet's rows use, so the page needs no bookmark list of its own.
            bookmarked =
                    notesService
                            .bookmarkedProblemIds(userId, List.of(problemId))
                            .contains(problemId);
            progress =
                    progressRepository
                            .findByUserIdAndProblemId(userId, problemId)
                            .map(
                                    p ->
                                            new DsaProblemProgressDto(
                                                    p.getStatus().name(),
                                                    p.getAttemptCount(),
                                                    p.getLastLanguage()))
                            .orElse(DsaProblemProgressDto.notStarted());
        }

        return new DsaProblemDetailDto(
                problemId,
                problem.getSlug(),
                problem.getTitle(),
                problem.getStatement(),
                problem.getDifficulty().name(),
                problem.getEstimatedMinutes(),
                readTags(problem.getTags()),
                problem.getYoutubeUrl(),
                problem.getYoutubePosition(),
                step.getSheet().getPlaylistUrl(),
                problem.getPracticeUrl(),
                problem.getPracticePlatform(),
                step.getSlug(),
                step.getTitle(),
                problem.getSection().getTitle(),
                samples,
                hintCount,
                approaches,
                checks,
                harnesses,
                judgeable,
                totalCases,
                progress,
                bookmarked,
                previousSlug,
                nextSlug);
    }

    @Transactional(readOnly = true)
    public Optional<DsaSummaryDto> summaryFor(String userId) {
        Optional<DsaSheet> first =
                sheetRepository
                        .findByStatus(
                                DsaProblemStatus.PUBLISHED,
                                org.springframework.data.domain.PageRequest.of(0, 1))
                        .stream()
                        .findFirst();
        if (first.isEmpty()) return Optional.empty();

        DsaSheet sheet = first.get();
        Map<String, Long> totalByDifficulty = new HashMap<>();
        for (Object[] row :
                problemRepository.countBySheetIdGroupedByDifficulty(
                        sheet.getId(), DsaProblemStatus.PUBLISHED)) {
            totalByDifficulty.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }

        long total = totalByDifficulty.values().stream().mapToLong(Long::longValue).sum();
        long solved =
                progressDao.solvedCountPerStep(userId, sheet.getId()).values().stream()
                        .mapToLong(Long::longValue)
                        .sum();

        String nextSlug = null;
        String nextTitle = null;
        String nextStepSlug = null;
        Optional<UUID> nextId = progressDao.nextUnsolvedProblemId(userId, sheet.getId());
        if (nextId.isPresent()) {
            Optional<DsaProblem> next = problemRepository.findById(nextId.get());
            if (next.isPresent()) {
                nextSlug = next.get().getSlug();
                nextTitle = next.get().getTitle();
                nextStepSlug = next.get().getSection().getStep().getSlug();
            }
        }

        return Optional.of(
                new DsaSummaryDto(
                        sheet.getId(),
                        sheet.getSlug(),
                        sheet.getTitle(),
                        total,
                        solved,
                        totalByDifficulty,
                        progressDao.solvedCountPerDifficulty(userId, sheet.getId()),
                        nextSlug,
                        nextTitle,
                        nextStepSlug));
    }

    private Map<UUID, UserDsaProblemProgress> loadProgress(String userId, List<UUID> problemIds) {
        if (userId == null || userId.isBlank() || problemIds.isEmpty()) return Map.of();
        Map<UUID, UserDsaProblemProgress> byProblem = new HashMap<>();
        for (UserDsaProblemProgress progress :
                progressRepository.findByUserIdAndProblemIdIn(userId, problemIds)) {
            byProblem.put(progress.getProblemId(), progress);
        }
        return byProblem;
    }

    /** Reads a JSONB string array, tolerating malformed content rather than failing the request. */
    private List<String> readTags(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.debug("Unreadable JSON array in DSA content: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * A section's ancestry, root first.
     *
     * <p>Walks parents rather than querying, because the sections of the page's problems are
     * already loaded - and the chain is a handful of rows deep at worst. The guard is against a
     * cycle, which the schema permits even though nothing should create one; without it a bad row
     * would hang the request rather than render oddly.
     */
    private List<DsaSectionRefDto> sectionPath(DsaSection leaf) {
        List<DsaSectionRefDto> chain = new ArrayList<>();
        DsaSection current = leaf;
        int guard = 0;
        while (current != null && guard++ < 32) {
            chain.add(
                    new DsaSectionRefDto(current.getId(), current.getTitle(), current.getDepth()));
            current = current.getParent();
        }
        Collections.reverse(chain);
        return chain;
    }
}
