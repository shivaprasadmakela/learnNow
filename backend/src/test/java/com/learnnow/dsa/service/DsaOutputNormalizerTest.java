package com.learnnow.dsa.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Nearly every false "wrong answer" is invisible whitespace, and nearly every false "accepted"
 * would come from normalising too much. Both directions are pinned here.
 */
class DsaOutputNormalizerTest {

    @Test
    void ignoresATrailingNewlineTheDriverAddedAndTheAuthorDidNot() {
        assertThat(DsaOutputNormalizer.matches("2", "2\n")).isTrue();
    }

    @Test
    void ignoresWindowsLineEndingsFromAJsonFileAuthoredOnWindows() {
        assertThat(DsaOutputNormalizer.matches("1\r\n2\r\n", "1\n2\n")).isTrue();
    }

    @Test
    void ignoresTrailingSpacesAfterTheLastValueOnALine() {
        assertThat(DsaOutputNormalizer.matches("1 2 3", "1 2 3   \n")).isTrue();
    }

    @Test
    void ignoresExtraBlankLinesAtTheEnd() {
        assertThat(DsaOutputNormalizer.matches("7", "7\n\n\n")).isTrue();
    }

    @Test
    void ignoresTheLeadingNewlineEveryDelimitedBlockArrivesWith() {
        // The driver prints its delimiter on its own line, so case 2 onwards begin with that
        // line's terminator. Treating it as significant failed every case but the first.
        assertThat(DsaOutputNormalizer.matches("2", "\n2\n")).isTrue();
    }

    @Test
    void keepsInteriorSpacingSignificant() {
        // "123" and "1 2 3" are different answers. Collapsing them would pass wrong solutions.
        assertThat(DsaOutputNormalizer.matches("1 2 3", "123")).isFalse();
    }

    @Test
    void keepsBlankLinesInTheMiddleSignificant() {
        assertThat(DsaOutputNormalizer.matches("a\n\nb", "a\nb")).isFalse();
    }

    @Test
    void treatsNullAndEmptyAsTheSameEmptyOutput() {
        assertThat(DsaOutputNormalizer.normalize(null)).isEmpty();
        assertThat(DsaOutputNormalizer.normalize("   \n\n")).isEmpty();
        assertThat(DsaOutputNormalizer.matches(null, "")).isTrue();
    }

    @Test
    void isSymmetric() {
        assertThat(DsaOutputNormalizer.matches("5\n", "5"))
                .isEqualTo(DsaOutputNormalizer.matches("5", "5\n"));
    }
}
