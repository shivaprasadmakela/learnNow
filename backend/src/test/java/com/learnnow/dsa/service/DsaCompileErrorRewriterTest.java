package com.learnnow.dsa.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * The driver contributes every line above the splice point, so an unrewritten diagnostic points
 * confidently at a line the learner cannot see — worse than pointing nowhere.
 */
class DsaCompileErrorRewriterTest {

    @Test
    void mapsAGccDiagnosticBackToTheLearnersOwnLineNumber() {
        // 30 driver lines above the splice; the learner's line 6 is the engine's line 36.
        String rewritten =
                DsaCompileErrorRewriter.rewrite("main.cpp:36:9: error: expected ';'", 30, 20);

        assertThat(rewritten).contains("main.cpp:6:9");
        assertThat(rewritten).doesNotContain(":36:");
    }

    @Test
    void mapsAJavacDiagnosticWithNoColumn() {
        assertThat(DsaCompileErrorRewriter.rewrite("Main.java:14: error: bad thing", 10, 20))
                .contains("Main.java:4:")
                .doesNotContain("Main.java:14:");
    }

    @Test
    void mapsAPythonStyleBareLineNumber() {
        assertThat(DsaCompileErrorRewriter.rewrite("  File \"main.py\", line 25", 20, 10))
                .contains("line 5");
    }

    @Test
    void marksDiagnosticsFromTheHarnessRatherThanBlamingTheLearner() {
        // Line 3 is inside the driver's own preamble: not the learner's to puzzle over.
        assertThat(DsaCompileErrorRewriter.rewrite("main.cpp:3:1: error: oops", 30, 20))
                .contains("[in the test harness]");
    }

    @Test
    void marksDiagnosticsBelowTheLearnersLastLine() {
        // 30 driver lines, 5 learner lines: engine line 40 is in the driver's main().
        assertThat(DsaCompileErrorRewriter.rewrite("main.cpp:40:2: error: oops", 30, 5))
                .contains("[in the test harness]");
    }

    @Test
    void leavesDiagnosticsAloneWhenThereIsNoOffset() {
        String raw = "main.cpp:12:3: error: something";
        assertThat(DsaCompileErrorRewriter.rewrite(raw, 0, 20)).isEqualTo(raw);
    }

    @Test
    void handlesNullAndBlankWithoutThrowing() {
        assertThat(DsaCompileErrorRewriter.rewrite(null, 30, 10)).isNull();
        assertThat(DsaCompileErrorRewriter.rewrite("   ", 30, 10)).isEqualTo("   ");
    }

    @Test
    void rewritesEveryDiagnosticInAMultiLineReport() {
        String rewritten =
                DsaCompileErrorRewriter.rewrite(
                        "main.cpp:36:9: error: first\nmain.cpp:38:1: error: second", 30, 20);

        assertThat(rewritten).contains("main.cpp:6:9").contains("main.cpp:8:1");
    }
}
