package com.learnnow.trainer.interview.entity;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * What a voice interview is. TOPIC asks bank questions on one completed topic; RETRY asks one
 * question from an earlier interview again; the rest are mock interviews written around the
 * learner's resume and target role.
 *
 * <p>{@code maxSeconds} is what the voice agent is told; {@code minutes} is what the learner is
 * told, rounded so the card does not promise more than the agent runs.
 */
public enum InterviewKind {
    TOPIC("Topic interview", 6, 360, false),
    RETRY("Retry a question", 3, 180, false),
    RESUME("Resume interview", 15, 900, true),
    HR("HR round", 10, 600, false),
    BEHAVIOURAL("Behavioural round", 10, 600, false),
    PROJECT("Project deep-dive", 10, 600, true),
    FULL("Full interview round", 25, 1500, true);

    private final String label;
    private final int minutes;
    private final int maxSeconds;
    private final boolean needsResume;

    InterviewKind(String label, int minutes, int maxSeconds, boolean needsResume) {
        this.label = label;
        this.minutes = minutes;
        this.maxSeconds = maxSeconds;
        this.needsResume = needsResume;
    }

    public String label() {
        return label;
    }

    public int minutes() {
        return minutes;
    }

    public int maxSeconds() {
        return maxSeconds;
    }

    public boolean needsResume() {
        return needsResume;
    }

    /** Mock interviews share one monthly quota, separate from topic interviews. */
    public boolean isMock() {
        return this != TOPIC && this != RETRY;
    }

    /** The spelling learnnow-ai uses in a plan's {@code kind}. */
    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static List<InterviewKind> mockKinds() {
        return Arrays.stream(values()).filter(InterviewKind::isMock).toList();
    }
}
