package com.learnnow.dsa.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.compiler.dto.request.ExecuteCodeRequest;
import com.learnnow.compiler.dto.response.ExecuteCodeResponse;
import com.learnnow.compiler.service.CompilerSnippetService;
import com.learnnow.dsa.dto.response.DsaCaseResultDto;
import com.learnnow.dsa.entity.DsaHarness;
import com.learnnow.dsa.entity.DsaTestCase;
import com.learnnow.dsa.entity.DsaVerdict;
import com.learnnow.dsa.repository.DsaHarnessRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Turns a fragment into a verdict.
 *
 * <p>The learner submits a {@code Solution} class with no {@code main}, so something has to supply
 * the driver that reads input, calls their method and prints the result. That splice happens here,
 * on the server, for two reasons: the driver embeds the whole I/O contract and often the shape of
 * the answer, and the hidden test data must never be in a payload the browser can read.
 *
 * <p>The driver loops internally over a case count it reads from stdin, so a run over twenty test
 * cases is <em>one</em> submission to the execution engine rather than twenty compilations. That is
 * the difference between this module being affordable to operate and not.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DsaExecutionService {

    /** Printed by the driver after each case, and what we split the combined stdout on. */
    public static final String CASE_DELIMITER = "<<<LN-CASE-END>>>";

    /**
     * The engine caps stdin, so a long case list is run in several submissions rather than one
     * oversized one. Kept a little under the declared limit to leave room for the count line.
     */
    private static final int MAX_STDIN_CHARS = 7_800;

    /** Enough to judge a solution; far short of enough to use us as a compute service. */
    private static final int MAX_CASES_PER_REQUEST = 20;

    private final DsaHarnessRepository harnessRepository;
    private final CompilerSnippetService compilerSnippetService;

    /** One case's outcome, before it is narrowed down for the client. */
    public record CaseOutcome(
            int caseNumber,
            boolean sample,
            DsaVerdict verdict,
            String input,
            String expected,
            String actual) {}

    /** Everything a run produced. */
    public record ExecutionOutcome(
            DsaVerdict verdict,
            List<CaseOutcome> cases,
            int passedCount,
            int totalCount,
            Integer firstFailedCase,
            String compileOutput,
            String stderr,
            String stdout,
            Integer runtimeMs,
            Long memoryKb,
            /** Set when the case list was shortened, so the caller can say so out loud. */
            String truncationNotice) {}

    @Transactional(readOnly = true)
    public DsaHarness requireHarness(UUID problemId, String language) {
        return harnessRepository
                .findByProblemIdAndLanguageIgnoreCase(problemId, language)
                .orElseThrow(() -> new NotFoundException("dsa_harness_not_found"));
    }

    /**
     * Runs {@code userCode} against {@code cases}.
     *
     * <p>Cases are run in submission-sized batches, and a batch that does not come back fully
     * accepted stops the run: the cases after the failure are reported as unrun rather than
     * silently dropped. That mirrors how every online judge behaves - it reports the first failing
     * case - so it reads as intentional instead of broken.
     */
    public ExecutionOutcome execute(
            UUID problemId, String language, String userCode, List<DsaTestCase> cases) {

        DsaHarness harness = requireHarness(problemId, language);

        String truncationNotice = null;
        List<DsaTestCase> selected = cases;
        if (selected.size() > MAX_CASES_PER_REQUEST) {
            selected = selected.subList(0, MAX_CASES_PER_REQUEST);
            truncationNotice =
                    "Judged the first " + MAX_CASES_PER_REQUEST + " of " + cases.size() + " cases.";
        }

        if (selected.isEmpty()) {
            return new ExecutionOutcome(
                    DsaVerdict.ENGINE_ERROR,
                    List.of(),
                    0,
                    0,
                    null,
                    null,
                    "This problem has no test cases yet.",
                    null,
                    null,
                    null,
                    null);
        }

        String source = splice(harness.getDriverCode(), userCode);
        int linesBefore = linesBeforePlaceholder(harness.getDriverCode());
        int userLines = countLines(userCode);

        List<CaseOutcome> outcomes = new ArrayList<>();
        int passed = 0;
        Integer firstFailed = null;
        DsaVerdict overall = DsaVerdict.ACCEPTED;
        String compileOutput = null;
        String stderr = null;
        StringBuilder allStdout = new StringBuilder();
        Integer runtimeMs = null;
        Long memoryKb = null;

        int index = 0;
        for (List<DsaTestCase> batch : batch(selected)) {
            ExecuteCodeResponse response =
                    compilerSnippetService.executeCode(
                            ExecuteCodeRequest.builder()
                                    .language(language)
                                    .code(source)
                                    .stdin(buildStdin(batch))
                                    .build());

            if (response.getTimeSeconds() != null && runtimeMs == null) {
                runtimeMs = (int) Math.round(response.getTimeSeconds() * 1000);
            }
            if (response.getMemoryBytes() != null && memoryKb == null) {
                memoryKb = response.getMemoryBytes() / 1024L;
            }
            if (response.getStdout() != null) {
                allStdout.append(response.getStdout());
            }

            DsaVerdict engineVerdict = classifyEngineFailure(response);
            if (engineVerdict != null) {
                compileOutput =
                        DsaCompileErrorRewriter.rewrite(
                                response.getCompileOutput(), linesBefore, userLines);
                stderr =
                        DsaCompileErrorRewriter.rewrite(
                                response.getStderr(), linesBefore, userLines);
                overall = engineVerdict;
                firstFailed = index + 1;
                for (DsaTestCase unrun : batch) {
                    index++;
                    outcomes.add(
                            new CaseOutcome(
                                    index,
                                    unrun.isSample(),
                                    engineVerdict,
                                    unrun.getInput(),
                                    unrun.getExpectedOutput(),
                                    null));
                }
                break;
            }

            List<String> actuals = splitCases(response.getStdout());
            boolean batchFailed = false;
            for (int i = 0; i < batch.size(); i++) {
                DsaTestCase testCase = batch.get(i);
                index++;
                String actual = i < actuals.size() ? actuals.get(i) : null;

                if (actual != null
                        && DsaOutputNormalizer.matches(testCase.getExpectedOutput(), actual)) {
                    passed++;
                    outcomes.add(
                            new CaseOutcome(
                                    index,
                                    testCase.isSample(),
                                    DsaVerdict.ACCEPTED,
                                    testCase.getInput(),
                                    testCase.getExpectedOutput(),
                                    actual));
                } else {
                    outcomes.add(
                            new CaseOutcome(
                                    index,
                                    testCase.isSample(),
                                    DsaVerdict.WRONG_ANSWER,
                                    testCase.getInput(),
                                    testCase.getExpectedOutput(),
                                    actual));
                    if (firstFailed == null) {
                        firstFailed = index;
                        overall = DsaVerdict.WRONG_ANSWER;
                    }
                    batchFailed = true;
                }
            }

            if (batchFailed) break;
        }

        return new ExecutionOutcome(
                overall,
                outcomes,
                passed,
                selected.size(),
                firstFailed,
                blankToNull(compileOutput),
                blankToNull(stderr),
                allStdout.toString(),
                runtimeMs,
                memoryKb,
                truncationNotice);
    }

    /** Splices the learner's code into the driver at its placeholder. */
    public String splice(String driverCode, String userCode) {
        return driverCode.replace(
                DsaHarness.USER_CODE_PLACEHOLDER, userCode == null ? "" : userCode);
    }

    /**
     * How many driver lines sit above the learner's first line. Feeds the diagnostic renumbering;
     * without it every compile error points at a line the learner cannot see.
     */
    public int linesBeforePlaceholder(String driverCode) {
        int idx = driverCode.indexOf(DsaHarness.USER_CODE_PLACEHOLDER);
        if (idx < 0) return 0;
        int newlines = 0;
        for (int i = 0; i < idx; i++) {
            if (driverCode.charAt(i) == '\n') newlines++;
        }
        return newlines;
    }

    /** Judge0's stdout for one batch, split back into per-case blocks. */
    public List<String> splitCases(String stdout) {
        if (stdout == null || stdout.isEmpty()) return List.of();
        List<String> blocks = new ArrayList<>();
        for (String block : stdout.split(java.util.regex.Pattern.quote(CASE_DELIMITER), -1)) {
            blocks.add(block);
        }
        // A trailing delimiter leaves an empty tail that is not a case.
        if (!blocks.isEmpty() && blocks.get(blocks.size() - 1).isBlank()) {
            blocks.remove(blocks.size() - 1);
        }
        return blocks;
    }

    String buildStdin(List<DsaTestCase> cases) {
        StringBuilder stdin = new StringBuilder();
        stdin.append(cases.size()).append('\n');
        for (DsaTestCase testCase : cases) {
            String input = testCase.getInput() == null ? "" : testCase.getInput();
            stdin.append(input);
            if (!input.endsWith("\n")) stdin.append('\n');
        }
        return stdin.toString();
    }

    /** Groups cases so each submission's stdin stays inside the engine's limit. */
    List<List<DsaTestCase>> batch(List<DsaTestCase> cases) {
        List<List<DsaTestCase>> batches = new ArrayList<>();
        List<DsaTestCase> current = new ArrayList<>();
        int size = 0;

        for (DsaTestCase testCase : cases) {
            int caseSize = (testCase.getInput() == null ? 0 : testCase.getInput().length()) + 1;
            if (!current.isEmpty() && size + caseSize > MAX_STDIN_CHARS) {
                batches.add(current);
                current = new ArrayList<>();
                size = 0;
            }
            current.add(testCase);
            size += caseSize;
        }
        if (!current.isEmpty()) batches.add(current);
        return batches;
    }

    /**
     * Maps an engine response to a verdict, or null when the code ran and only the answers are in
     * question.
     *
     * <p>Judge0 status ids: 3 accepted, 5 time limit, 6 compilation error, 7-12 runtime signals.
     */
    DsaVerdict classifyEngineFailure(ExecuteCodeResponse response) {
        Integer status = response.getStatusCode();

        if (response.getCompileOutput() != null && !response.getCompileOutput().isBlank()) {
            return DsaVerdict.COMPILE_ERROR;
        }
        if (status != null) {
            if (status == 5) return DsaVerdict.TIME_LIMIT;
            if (status == 6) return DsaVerdict.COMPILE_ERROR;
            if (status >= 7 && status <= 12) return DsaVerdict.RUNTIME_ERROR;
            if (status == 13 || status == 14) return DsaVerdict.ENGINE_ERROR;
        }
        if (response.getStderr() != null && !response.getStderr().isBlank()) {
            return DsaVerdict.RUNTIME_ERROR;
        }
        return null;
    }

    /** Narrows an outcome for the client: hidden cases give up their index and nothing else. */
    public List<DsaCaseResultDto> toClientCases(List<CaseOutcome> outcomes) {
        List<DsaCaseResultDto> results = new ArrayList<>();
        for (CaseOutcome outcome : outcomes) {
            if (outcome.sample()) {
                results.add(
                        new DsaCaseResultDto(
                                outcome.caseNumber(),
                                true,
                                outcome.verdict().name(),
                                outcome.input(),
                                outcome.expected(),
                                outcome.actual()));
            } else {
                results.add(
                        DsaCaseResultDto.hidden(outcome.caseNumber(), outcome.verdict().name()));
            }
        }
        return results;
    }

    private static int countLines(String code) {
        if (code == null || code.isEmpty()) return 0;
        int lines = 1;
        for (int i = 0; i < code.length(); i++) {
            if (code.charAt(i) == '\n') lines++;
        }
        return lines;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
