package com.learnnow.trainer.readiness;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ReadinessServiceTest {

    @Test
    void bothSignalsWeighInterviewSixtyQuizForty() {
        // 0.6 * 80 + 0.4 * 50 = 68
        assertThat(ReadinessService.readiness(80, 50)).isEqualTo(68);
    }

    @Test
    void oneSignalIsUsedAsIs() {
        assertThat(ReadinessService.readiness(72, null)).isEqualTo(72);
        assertThat(ReadinessService.readiness(null, 41)).isEqualTo(41);
    }

    @Test
    void noSignalIsNull() {
        assertThat(ReadinessService.readiness(null, null)).isNull();
    }

    @Test
    void levelBoundaries() {
        assertThat(ReadinessService.level(null)).isEqualTo("untested");
        assertThat(ReadinessService.level(0)).isEqualTo("weak");
        assertThat(ReadinessService.level(54)).isEqualTo("weak");
        assertThat(ReadinessService.level(55)).isEqualTo("okay");
        assertThat(ReadinessService.level(74)).isEqualTo("okay");
        assertThat(ReadinessService.level(75)).isEqualTo("strong");
        assertThat(ReadinessService.level(100)).isEqualTo("strong");
    }

    @Test
    void quizAccuracyNeedsFiveAnswers() {
        assertThat(ReadinessService.quizAccuracy(4, 4)).isNull();
        assertThat(ReadinessService.quizAccuracy(5, 4)).isEqualTo(80);
        assertThat(ReadinessService.quizAccuracy(8, 3)).isEqualTo(38);
    }
}
