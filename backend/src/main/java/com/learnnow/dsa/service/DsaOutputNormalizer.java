package com.learnnow.dsa.service;

/**
 * Makes two outputs comparable without making them equal.
 *
 * <p>Nearly every "wrong answer" that is really a false negative comes from invisible whitespace: a
 * trailing newline the driver emits and the expected output does not, a {@code \r\n} from a file
 * authored on Windows, a trailing space after the last number on a line. All three are normalised
 * away here.
 *
 * <p>Leading blank lines go too, and that one is not cosmetic. The driver prints its case delimiter
 * on its own line, so every block after the first arrives beginning with that line's terminator.
 * Treating it as significant failed every case but the first against a correct answer.
 *
 * <p>What is deliberately <em>not</em> normalised is interior spacing. {@code "1 2 3"} and {@code
 * "123"} are different answers, and collapsing them would let wrong solutions pass. Neither are
 * interior blank lines. Both sides go through this same method, so the comparison stays symmetric.
 */
public final class DsaOutputNormalizer {

    private DsaOutputNormalizer() {}

    public static String normalize(String raw) {
        if (raw == null || raw.isEmpty()) return "";

        String[] lines = raw.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);

        int firstMeaningful = -1;
        int lastMeaningful = -1;
        for (int i = 0; i < lines.length; i++) {
            lines[i] = stripTrailing(lines[i]);
            if (!lines[i].isEmpty()) {
                if (firstMeaningful < 0) firstMeaningful = i;
                lastMeaningful = i;
            }
        }
        if (firstMeaningful < 0) return "";

        StringBuilder out = new StringBuilder();
        for (int i = firstMeaningful; i <= lastMeaningful; i++) {
            if (i > firstMeaningful) out.append('\n');
            out.append(lines[i]);
        }
        return out.toString();
    }

    public static boolean matches(String expected, String actual) {
        return normalize(expected).equals(normalize(actual));
    }

    private static String stripTrailing(String line) {
        int end = line.length();
        while (end > 0 && Character.isWhitespace(line.charAt(end - 1))) {
            end--;
        }
        return end == line.length() ? line : line.substring(0, end);
    }
}
