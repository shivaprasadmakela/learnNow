package com.learnnow.dsa.dto.response;

/**
 * One test case's outcome.
 *
 * <p>{@code input}, {@code expectedOutput} and {@code actualOutput} are populated only for sample
 * cases. For a hidden case the learner gets the index and the verdict and nothing else, which is
 * enough to know where they failed without handing over the test data.
 */
public record DsaCaseResultDto(
        int caseNumber,
        boolean sample,
        String verdict,
        String input,
        String expectedOutput,
        String actualOutput) {

    public static DsaCaseResultDto hidden(int caseNumber, String verdict) {
        return new DsaCaseResultDto(caseNumber, false, verdict, null, null, null);
    }
}
