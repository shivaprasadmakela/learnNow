package com.learnnow.dsa.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Renumbers compiler diagnostics into the learner's own line numbering.
 *
 * <p>The driver contributes everything above {@code {{USER_CODE}}} - includes, using-declarations,
 * a {@code main} - so the engine's "line 41" is the learner's line 6. Reporting the raw number is
 * worse than reporting none: it points confidently at a line the learner cannot see.
 *
 * <p>Diagnostics below the splice point map to nothing the learner wrote. Those keep their number
 * but are marked, so a genuine driver bug is still diagnosable by us rather than silently blamed on
 * them.
 */
public final class DsaCompileErrorRewriter {

    /** Matches gcc/clang/javac style {@code something:LINE:COL:} and {@code something:LINE:}. */
    private static final Pattern FILE_LINE = Pattern.compile("([\\w./\\-]+):(\\d+)(:\\d+)?");

    /** Matches Python-style {@code line 41}. */
    private static final Pattern BARE_LINE = Pattern.compile("\\bline (\\d+)\\b");

    private DsaCompileErrorRewriter() {}

    /**
     * @param diagnostics raw compile_output or stderr from the engine
     * @param linesBeforeUserCode how many driver lines precede the learner's first line
     * @param userCodeLineCount how many lines the learner actually submitted
     */
    public static String rewrite(
            String diagnostics, int linesBeforeUserCode, int userCodeLineCount) {
        if (diagnostics == null || diagnostics.isBlank() || linesBeforeUserCode <= 0) {
            return diagnostics;
        }

        String result =
                rewriteWith(FILE_LINE, diagnostics, linesBeforeUserCode, userCodeLineCount, 2);
        return rewriteWith(BARE_LINE, result, linesBeforeUserCode, userCodeLineCount, 1);
    }

    private static String rewriteWith(
            Pattern pattern,
            String diagnostics,
            int linesBefore,
            int userLineCount,
            int lineGroup) {

        Matcher matcher = pattern.matcher(diagnostics);
        StringBuilder out = new StringBuilder();

        while (matcher.find()) {
            int engineLine;
            try {
                engineLine = Integer.parseInt(matcher.group(lineGroup));
            } catch (NumberFormatException e) {
                matcher.appendReplacement(out, Matcher.quoteReplacement(matcher.group()));
                continue;
            }

            int userLine = engineLine - linesBefore;
            String replacement;
            if (userLine >= 1 && userLine <= Math.max(userLineCount, 1)) {
                replacement =
                        matcher.group()
                                .replaceFirst(
                                        Pattern.quote(matcher.group(lineGroup)),
                                        String.valueOf(userLine));
            } else {
                // Outside the learner's code: ours to fix, not theirs to puzzle over.
                replacement = matcher.group() + " [in the test harness]";
            }
            matcher.appendReplacement(out, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(out);
        return out.toString();
    }
}
