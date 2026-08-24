package com.learnnow.dsa.service;

import com.learnnow.common.dto.PageResponse;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.dsa.dto.request.DsaCheckAnswerRequest;
import com.learnnow.dsa.dto.request.DsaRunRequest;
import com.learnnow.dsa.dto.request.DsaSubmitRequest;
import com.learnnow.dsa.dto.response.*;
import com.learnnow.dsa.entity.*;
import com.learnnow.dsa.repository.*;
import com.learnnow.dsa.service.DsaExecutionService.ExecutionOutcome;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Run, Submit, and the inline check — everything a learner does that needs the engine. */
@Slf4j
@Service
@RequiredArgsConstructor
public class DsaSubmissionService {

    private final DsaProblemRepository problemRepository;
    private final DsaTestCaseRepository testCaseRepository;
    private final DsaCheckRepository checkRepository;
    private final UserDsaSubmissionRepository submissionRepository;
    private final DsaExecutionService executionService;
    private final DsaProgressService progressService;

    /**
     * Runs the sample cases, plus anything the learner typed into the panel.
     *
     * <p>Ad-hoc cases have no expected output, so they are reported as run rather than judged - the
     * learner reads the output themselves. Only real samples can pass or fail.
     */
    @Transactional
    public DsaRunResultDto run(String userId, UUID problemId, DsaRunRequest request) {
        requirePublished(problemId);

        List<DsaTestCase> cases =
                new ArrayList<>(
                        testCaseRepository.findByProblemIdAndSampleTrueOrderByOrderIndexAsc(
                                problemId));

        int adHocFrom = cases.size();
        for (String extra : request.safeExtraCases()) {
            if (extra == null || extra.isBlank()) continue;
            cases.add(
                    DsaTestCase.builder()
                            .orderIndex(cases.size() + 1)
                            .input(extra)
                            .expectedOutput("")
                            .sample(true)
                            .build());
        }

        ExecutionOutcome outcome =
                executionService.execute(problemId, request.language(), request.code(), cases);

        progressService.recordAttempt(userId, problemId, request.language());

        List<DsaCaseResultDto> results = executionService.toClientCases(outcome.cases());
        // An ad-hoc case cannot be wrong, only run. Relabel so the panel does not show a red cross
        // against a case the learner invented and never gave an answer for.
        List<DsaCaseResultDto> relabelled = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            DsaCaseResultDto r = results.get(i);
            if (i >= adHocFrom && !"COMPILE_ERROR".equals(r.verdict())) {
                relabelled.add(
                        new DsaCaseResultDto(
                                r.caseNumber(),
                                true,
                                "EXECUTED",
                                r.input(),
                                null,
                                r.actualOutput()));
            } else {
                relabelled.add(r);
            }
        }

        return new DsaRunResultDto(
                outcome.verdict().name(),
                outcome.passedCount(),
                Math.min(outcome.totalCount(), adHocFrom),
                outcome.firstFailedCase(),
                relabelled,
                outcome.compileOutput(),
                outcome.stderr(),
                outcome.stdout(),
                outcome.runtimeMs(),
                outcome.memoryKb());
    }

    /**
     * Runs every case and records the attempt.
     *
     * <p>Samples come first so a failure the learner can actually inspect surfaces before a hidden
     * one does.
     */
    @Transactional
    public DsaSubmitResultDto submit(String userId, UUID problemId, DsaSubmitRequest request) {
        requirePublished(problemId);

        List<DsaTestCase> all =
                new ArrayList<>(testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId));
        all.sort((a, b) -> Boolean.compare(!a.isSample(), !b.isSample()));

        ExecutionOutcome outcome =
                executionService.execute(problemId, request.language(), request.code(), all);

        UserDsaSubmission submission =
                submissionRepository.save(
                        UserDsaSubmission.builder()
                                .userId(userId)
                                .problemId(problemId)
                                .language(request.language())
                                .code(request.code())
                                .verdict(outcome.verdict())
                                .passedCount(outcome.passedCount())
                                .totalCount(outcome.totalCount())
                                .runtimeMs(outcome.runtimeMs())
                                .memoryKb(outcome.memoryKb())
                                .build());

        boolean newlySolved = false;
        int pointsAwarded = 0;

        if (outcome.verdict() == DsaVerdict.ENGINE_ERROR) {
            // Our failure, not theirs. Recorded above for diagnostics, but it does not count.
            log.warn("DSA engine error on problem {} for user {}", problemId, userId);
        } else if (outcome.verdict() == DsaVerdict.ACCEPTED) {
            DsaProgressService.ProgressOutcome result =
                    progressService.setStatus(
                            userId, problemId, DsaProgressStatus.SOLVED, request.language());
            newlySolved = result.newlySolved();
            pointsAwarded = result.pointsAwarded();
        } else {
            progressService.recordAttempt(userId, problemId, request.language());
        }

        return new DsaSubmitResultDto(
                submission.getId(),
                outcome.verdict().name(),
                outcome.passedCount(),
                outcome.totalCount(),
                outcome.firstFailedCase(),
                executionService.toClientCases(outcome.cases()),
                outcome.compileOutput(),
                outcome.stderr(),
                outcome.runtimeMs(),
                outcome.memoryKb(),
                newlySolved,
                pointsAwarded);
    }

    @Transactional(readOnly = true)
    public PageResponse<DsaSubmissionDto> submissions(
            String userId, UUID problemId, Pageable pageable) {

        Page<UserDsaSubmission> page =
                submissionRepository.findByUserIdAndProblemIdOrderByCreatedAtDesc(
                        userId, problemId, pageable);

        return PageResponse.of(
                page.map(
                        s ->
                                new DsaSubmissionDto(
                                        s.getId(),
                                        s.getLanguage(),
                                        s.getCode(),
                                        s.getVerdict().name(),
                                        s.getPassedCount(),
                                        s.getTotalCount(),
                                        s.getRuntimeMs(),
                                        s.getMemoryKb(),
                                        s.getCreatedAt())));
    }

    /**
     * Grades an inline check.
     *
     * <p>The comparison happens here, never in the browser: the check DTO the learner receives has
     * no field for the answer, and this is the only place it is revealed.
     */
    @Transactional
    public DsaCheckAnswerDto answerCheck(
            String userId, UUID checkId, DsaCheckAnswerRequest request) {

        DsaCheck check =
                checkRepository
                        .findById(checkId)
                        .orElseThrow(() -> new NotFoundException("dsa_check_not_found"));

        boolean correct =
                check.getCorrectAnswer() != null
                        && check.getCorrectAnswer()
                                .trim()
                                .equalsIgnoreCase(request.selectedOption().trim());

        int awarded = 0;
        if (correct) {
            awarded = check.getPoints();
            progressService.awardCheckPoints(userId, awarded);
        }

        return new DsaCheckAnswerDto(
                correct, check.getCorrectAnswer(), check.getExplanation(), awarded);
    }

    private void requirePublished(UUID problemId) {
        DsaProblem problem =
                problemRepository
                        .findById(problemId)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));
        if (problem.getStatus() != DsaProblemStatus.PUBLISHED) {
            throw new NotFoundException("dsa_problem_not_found");
        }
    }
}
