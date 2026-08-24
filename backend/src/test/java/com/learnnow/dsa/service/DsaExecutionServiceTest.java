package com.learnnow.dsa.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnnow.compiler.dto.request.ExecuteCodeRequest;
import com.learnnow.compiler.dto.response.ExecuteCodeResponse;
import com.learnnow.compiler.service.CompilerSnippetService;
import com.learnnow.dsa.entity.DsaHarness;
import com.learnnow.dsa.entity.DsaTestCase;
import com.learnnow.dsa.entity.DsaVerdict;
import com.learnnow.dsa.repository.DsaHarnessRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * The splice-and-judge path.
 *
 * <p>The point worth defending here is that a run over N cases is one submission, not N: the driver
 * loops internally and the server splits the combined output. Twenty compilations per Run is the
 * difference between this module being affordable to operate and not.
 */
class DsaExecutionServiceTest {

    private static final UUID PROBLEM_ID = UUID.randomUUID();

    private static final String DRIVER =
            """
            #include <iostream>
            using namespace std;
            {{USER_CODE}}
            int main() { return 0; }
            """;

    private DsaHarnessRepository harnessRepository;
    private CompilerSnippetService compilerService;
    private DsaExecutionService service;

    @BeforeEach
    void setUp() {
        harnessRepository = mock(DsaHarnessRepository.class);
        compilerService = mock(CompilerSnippetService.class);
        service = new DsaExecutionService(harnessRepository, compilerService);

        when(harnessRepository.findByProblemIdAndLanguageIgnoreCase(PROBLEM_ID, "cpp"))
                .thenReturn(
                        Optional.of(
                                DsaHarness.builder()
                                        .language("cpp")
                                        .starterCode("class Solution {};")
                                        .driverCode(DRIVER)
                                        .build()));
    }

    private static DsaTestCase testCase(int order, String input, String expected, boolean sample) {
        return DsaTestCase.builder()
                .orderIndex(order)
                .input(input)
                .expectedOutput(expected)
                .sample(sample)
                .build();
    }

    private static ExecuteCodeResponse ok(String stdout) {
        return ExecuteCodeResponse.builder().stdout(stdout).statusCode(3).build();
    }

    private String delimited(String... outputs) {
        StringBuilder sb = new StringBuilder();
        for (String out : outputs) {
            sb.append(out).append('\n').append(DsaExecutionService.CASE_DELIMITER).append('\n');
        }
        return sb.toString();
    }

    @Test
    void runsEveryCaseInASingleSubmission() {
        when(compilerService.executeCode(any())).thenReturn(ok(delimited("1", "2", "3")));

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(
                                testCase(1, "a\n", "1", true),
                                testCase(2, "b\n", "2", true),
                                testCase(3, "c\n", "3", false)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.ACCEPTED);
        assertThat(outcome.passedCount()).isEqualTo(3);
        verify(compilerService, times(1)).executeCode(any());
    }

    @Test
    void splicesTheLearnersCodeIntoTheDriverAndPrefixesTheCaseCount() {
        when(compilerService.executeCode(any())).thenReturn(ok(delimited("1")));

        service.execute(
                PROBLEM_ID,
                "cpp",
                "class Solution { int f(){return 1;} };",
                List.of(testCase(1, "5\n", "1", true)));

        ArgumentCaptor<ExecuteCodeRequest> captor =
                ArgumentCaptor.forClass(ExecuteCodeRequest.class);
        verify(compilerService).executeCode(captor.capture());

        ExecuteCodeRequest sent = captor.getValue();
        assertThat(sent.getCode()).contains("int f(){return 1;}");
        assertThat(sent.getCode()).doesNotContain(DsaHarness.USER_CODE_PLACEHOLDER);
        assertThat(sent.getStdin()).startsWith("1\n").contains("5");
    }

    @Test
    void reportsTheFirstFailingCaseAndStopsThere() {
        when(compilerService.executeCode(any())).thenReturn(ok(delimited("1", "999")));

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(testCase(1, "a\n", "1", true), testCase(2, "b\n", "2", true)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.WRONG_ANSWER);
        assertThat(outcome.firstFailedCase()).isEqualTo(2);
        assertThat(outcome.passedCount()).isEqualTo(1);
    }

    @Test
    void aCompileErrorIsNotAWrongAnswer() {
        when(compilerService.executeCode(any()))
                .thenReturn(
                        ExecuteCodeResponse.builder()
                                .compileOutput("main.cpp:5:1: error: expected ';'")
                                .statusCode(6)
                                .build());

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {",
                        List.of(testCase(1, "a\n", "1", true)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.COMPILE_ERROR);
        assertThat(outcome.passedCount()).isZero();
        // Renumbered into the learner's own lines on the way out.
        assertThat(outcome.compileOutput()).contains("[in the test harness]");
    }

    @Test
    void aTimeoutIsReportedAsSuchRatherThanAsAWrongAnswer() {
        when(compilerService.executeCode(any()))
                .thenReturn(ExecuteCodeResponse.builder().statusCode(5).build());

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(testCase(1, "a\n", "1", true)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.TIME_LIMIT);
    }

    @Test
    void aRuntimeErrorLeavesLaterCasesUnrunRatherThanFailed() {
        when(compilerService.executeCode(any()))
                .thenReturn(ExecuteCodeResponse.builder().statusCode(11).stderr("boom").build());

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(testCase(1, "a\n", "1", true), testCase(2, "b\n", "2", true)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.RUNTIME_ERROR);
        assertThat(outcome.cases()).hasSize(2);
        assertThat(outcome.cases()).allMatch(c -> c.verdict() == DsaVerdict.RUNTIME_ERROR);
        assertThat(outcome.firstFailedCase()).isEqualTo(1);
    }

    @Test
    void trailingWhitespaceDifferencesStillPass() {
        when(compilerService.executeCode(any())).thenReturn(ok(delimited("42   ")));

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(testCase(1, "a\n", "42", true)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.ACCEPTED);
    }

    @Test
    void leadingIndentationInsideALineStaysSignificant() {
        // Pattern-printing problems are a whole section of any DSA sheet, and there the leading
        // spaces on each line *are* the answer. Stripping them would pass wrong solutions.
        when(compilerService.executeCode(any())).thenReturn(ok(delimited("  *")));

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(testCase(1, "a\n", "*", true)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.WRONG_ANSWER);
    }

    @Test
    void hiddenCasesGiveUpTheirIndexAndNothingElse() {
        when(compilerService.executeCode(any())).thenReturn(ok(delimited("1", "999")));

        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(
                                testCase(1, "a\n", "1", true),
                                testCase(2, "secret\n", "2", false)));

        var client = service.toClientCases(outcome.cases());

        assertThat(client.get(0).input()).isEqualTo("a\n");
        assertThat(client.get(1).caseNumber()).isEqualTo(2);
        assertThat(client.get(1).input()).isNull();
        assertThat(client.get(1).expectedOutput()).isNull();
        assertThat(client.get(1).actualOutput()).isNull();
    }

    @Test
    void oversizedCaseListsAreBatchedRatherThanSentAsOneOversizedStdin() {
        when(compilerService.executeCode(any()))
                .thenReturn(ok(delimited("1")))
                .thenReturn(ok(delimited("1")));

        String bigInput = "x".repeat(5_000) + "\n";
        var outcome =
                service.execute(
                        PROBLEM_ID,
                        "cpp",
                        "class Solution {};",
                        List.of(
                                testCase(1, bigInput, "1", true),
                                testCase(2, bigInput, "1", true)));

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.ACCEPTED);
        verify(compilerService, times(2)).executeCode(any());
    }

    @Test
    void aProblemWithNoTestCasesCannotBeJudged() {
        var outcome = service.execute(PROBLEM_ID, "cpp", "class Solution {};", List.of());

        assertThat(outcome.verdict()).isEqualTo(DsaVerdict.ENGINE_ERROR);
        assertThat(outcome.totalCount()).isZero();
    }

    @Test
    void countsTheDriverLinesAboveTheSplicePoint() {
        assertThat(service.linesBeforePlaceholder(DRIVER)).isEqualTo(2);
    }
}
