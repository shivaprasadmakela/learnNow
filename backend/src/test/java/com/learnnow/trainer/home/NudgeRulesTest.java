package com.learnnow.trainer.home;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnnow.trainer.home.NudgeRules.Input;
import com.learnnow.trainer.home.NudgeRules.NextLesson;
import com.learnnow.trainer.home.NudgeRules.Nudge;
import com.learnnow.trainer.home.NudgeRules.TopicRef;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class NudgeRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 13);
    private static final NextLesson NEXT =
            new NextLesson(
                    UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "Spring", "Beans");

    /** A learner with nothing to nudge about: goal set, resume present, active today. */
    private static Input quiet() {
        return new Input(
                TODAY, 10, 0, true, 0L, NEXT, null, null, null, true, null, true, true, true, true);
    }

    private static List<String> kinds(Input in) {
        return NudgeRules.decide(in).stream().map(Nudge::kind).toList();
    }

    @Test
    void quietLearnerGetsNothing() {
        assertThat(NudgeRules.decide(quiet())).isEmpty();
    }

    @Test
    void streakRiskNeedsStreakEveningAndNothingStudied() {
        Input base = quiet();
        Input risk =
                new Input(
                        TODAY, 18, 4, false, 0L, NEXT, null, null, null, true, null, true, true,
                        true, true);
        assertThat(kinds(risk)).containsExactly("streak_risk");
        assertThat(NudgeRules.decide(risk).get(0).action().type()).isEqualTo("open_lesson");
        assertThat(NudgeRules.decide(risk).get(0).action().topicId()).isEqualTo(NEXT.topicId());

        Input morning =
                new Input(
                        TODAY, 17, 4, false, 0L, NEXT, null, null, null, true, null, true, true,
                        true, true);
        Input shortStreak =
                new Input(
                        TODAY, 20, 1, false, 0L, NEXT, null, null, null, true, null, true, true,
                        true, true);
        assertThat(kinds(morning)).isEmpty();
        assertThat(kinds(shortStreak)).isEmpty();
        assertThat(kinds(base)).isEmpty();
    }

    @Test
    void comebackAfterThreeDays() {
        Input in =
                new Input(
                        TODAY, 10, 0, false, 3L, NEXT, null, null, null, true, null, true, true,
                        true, true);
        assertThat(kinds(in)).containsExactly("comeback");
        Input two =
                new Input(
                        TODAY, 10, 0, false, 2L, NEXT, null, null, null, true, null, true, true,
                        true, true);
        assertThat(kinds(two)).isEmpty();
    }

    @Test
    void interviewReadyOpensTopicInterview() {
        UUID topic = UUID.randomUUID();
        Input in =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        new TopicRef(topic, "Spring", null),
                        null,
                        null,
                        true,
                        null,
                        true,
                        true,
                        true,
                        true);
        List<Nudge> out = NudgeRules.decide(in);
        assertThat(out).extracting(Nudge::kind).containsExactly("interview_ready");
        assertThat(out.get(0).action().type()).isEqualTo("topic_interview");
        assertThat(out.get(0).action().topicId()).isEqualTo(topic);
    }

    @Test
    void weakTopicOnlyBelow55() {
        UUID topic = UUID.randomUUID();
        Input weak =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        new TopicRef(topic, "JPA", 54),
                        null,
                        true,
                        null,
                        true,
                        true,
                        true,
                        true);
        Input fine =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        new TopicRef(topic, "JPA", 55),
                        null,
                        true,
                        null,
                        true,
                        true,
                        true,
                        true);
        List<Nudge> out = NudgeRules.decide(weak);
        assertThat(out).extracting(Nudge::kind).containsExactly("weak_topic");
        assertThat(out.get(0).action().type()).isEqualTo("ask_ai");
        assertThat(out.get(0).action().prompt()).contains("JPA");
        assertThat(NudgeRules.decide(fine)).isEmpty();
    }

    @Test
    void quizMistakesBelowFiftyPercentAndNotDuplicatingWeakTopic() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        Input in =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        new TopicRef(a, "JPA", 40),
                        new TopicRef(b, "REST", 30),
                        true,
                        null,
                        true,
                        true,
                        true,
                        true);
        assertThat(kinds(in)).containsExactly("weak_topic", "quiz_mistakes");

        Input same =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        new TopicRef(a, "JPA", 40),
                        new TopicRef(a, "JPA", 30),
                        true,
                        null,
                        true,
                        true,
                        true,
                        true);
        assertThat(kinds(same)).containsExactly("weak_topic");

        Input fifty =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        null,
                        new TopicRef(b, "REST", 50),
                        true,
                        null,
                        true,
                        true,
                        true,
                        true);
        assertThat(kinds(fifty)).isEmpty();
    }

    @Test
    void setGoalWhenNoGoal() {
        Input in =
                new Input(
                        TODAY, 10, 0, true, 0L, NEXT, null, null, null, false, null, true, true,
                        true, true);
        List<Nudge> out = NudgeRules.decide(in);
        assertThat(out).extracting(Nudge::kind).containsExactly("set_goal");
        assertThat(out.get(0).action().type()).isEqualTo("open_trainer");
    }

    @Test
    void uploadResumeWhenTargetDateWithinSixtyDaysAndNoResume() {
        Input near =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        null,
                        null,
                        true,
                        TODAY.plusDays(60),
                        false,
                        true,
                        true,
                        true);
        Input far =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        null,
                        null,
                        true,
                        TODAY.plusDays(61),
                        false,
                        true,
                        true,
                        true);
        Input has =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        null,
                        null,
                        null,
                        true,
                        TODAY.plusDays(10),
                        true,
                        true,
                        true,
                        true);
        assertThat(kinds(near)).containsExactly("upload_resume");
        assertThat(NudgeRules.decide(near).get(0).action().type()).isEqualTo("upload_resume");
        assertThat(kinds(far)).isEmpty();
        assertThat(kinds(has)).isEmpty();
    }

    @Test
    void atMostThreeMostUrgentFirst() {
        UUID a = UUID.randomUUID();
        Input in =
                new Input(
                        TODAY,
                        19,
                        5,
                        false,
                        4L,
                        NEXT,
                        new TopicRef(a, "Spring", null),
                        new TopicRef(a, "JPA", 20),
                        null,
                        false,
                        null,
                        false,
                        true,
                        true,
                        true);
        assertThat(kinds(in)).containsExactly("streak_risk", "comeback", "interview_ready");
    }

    @Test
    void switchedOffFeaturesDropTheirNudges() {
        UUID a = UUID.randomUUID();
        Input in =
                new Input(
                        TODAY,
                        10,
                        0,
                        true,
                        0L,
                        NEXT,
                        new TopicRef(a, "Spring", null),
                        new TopicRef(a, "JPA", 20),
                        null,
                        true,
                        TODAY.plusDays(5),
                        false,
                        false,
                        false,
                        false);
        assertThat(NudgeRules.decide(in)).isEmpty();
    }
}
