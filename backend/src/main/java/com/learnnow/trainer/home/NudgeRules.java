package com.learnnow.trainer.home;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Which nudges the trainer home shows, most urgent first, at most {@link #MAX_NUDGES}. A pure
 * function of {@link Input}, so every rule is tested without a database.
 *
 * <p>The order is the order of the rules: a streak about to break tonight matters more than a
 * missing goal. A nudge whose action needs a feature an admin switched off is not shown.
 */
public final class NudgeRules {

    public static final int MAX_NUDGES = 3;
    static final int STREAK_RISK_HOUR = 18;
    static final int COMEBACK_DAYS = 3;
    static final int WEAK_BELOW = 55;
    static final int QUIZ_MISTAKES_BELOW = 50;
    static final int RESUME_WITHIN_DAYS = 60;

    private NudgeRules() {}

    public record NextLesson(
            UUID pathId, UUID topicId, UUID subtopicId, String topicTitle, String lessonTitle) {}

    /** A topic and the number that made it stand out (readiness or quiz accuracy, 0-100). */
    public record TopicRef(UUID topicId, String title, Integer value) {}

    public record Input(
            LocalDate today,
            int localHour,
            int streakDays,
            boolean studiedToday,
            Long daysSinceActivity,
            NextLesson nextLesson,
            TopicRef interviewReady,
            TopicRef weakest,
            TopicRef quizMistakes,
            boolean hasGoal,
            LocalDate targetDate,
            boolean hasResume,
            boolean askAiOn,
            boolean topicInterviewOn,
            boolean resumeOn) {}

    public record Action(
            String type, String label, UUID topicId, UUID subtopicId, UUID pathId, String prompt) {

        static Action openLesson(NextLesson l, String label) {
            return new Action("open_lesson", label, l.topicId(), l.subtopicId(), l.pathId(), null);
        }

        static Action simple(String type, String label) {
            return new Action(type, label, null, null, null, null);
        }
    }

    public record Nudge(String kind, String title, String body, Action action) {}

    public static List<Nudge> decide(Input in) {
        List<Nudge> out = new ArrayList<>();
        NextLesson next = in.nextLesson();

        if (in.streakDays() >= 2 && !in.studiedToday() && in.localHour() >= STREAK_RISK_HOUR) {
            out.add(
                    new Nudge(
                            "streak_risk",
                            "Keep your " + in.streakDays() + "-day streak",
                            next != null
                                    ? "You have not studied today yet. One lesson keeps it going: "
                                            + next.lessonTitle()
                                            + "."
                                    : "You have not studied today yet. One lesson keeps it going.",
                            next != null
                                    ? Action.openLesson(next, "Continue")
                                    : Action.simple("open_trainer", "Open trainer")));
        }

        if (in.daysSinceActivity() != null && in.daysSinceActivity() >= COMEBACK_DAYS) {
            out.add(
                    new Nudge(
                            "comeback",
                            "Welcome back",
                            "It has been "
                                    + in.daysSinceActivity()
                                    + " days. "
                                    + (next != null
                                            ? "Pick up where you left off with "
                                                    + next.lessonTitle()
                                                    + "."
                                            : "Pick up where you left off."),
                            next != null
                                    ? Action.openLesson(next, "Pick up")
                                    : Action.simple("open_trainer", "Open trainer")));
        }

        TopicRef ready = in.interviewReady();
        if (in.topicInterviewOn() && ready != null) {
            out.add(
                    new Nudge(
                            "interview_ready",
                            "Practise " + ready.title() + " out loud",
                            "You finished "
                                    + ready.title()
                                    + ". A short voice interview shows what you can explain and"
                                    + " what you cannot yet.",
                            new Action(
                                    "topic_interview",
                                    "Start interview",
                                    ready.topicId(),
                                    null,
                                    null,
                                    null)));
        }

        TopicRef weak = in.weakest();
        boolean weakShown = false;
        if (in.askAiOn() && weak != null && weak.value() != null && weak.value() < WEAK_BELOW) {
            weakShown = true;
            out.add(
                    new Nudge(
                            "weak_topic",
                            weak.title() + " needs work",
                            "Your readiness for "
                                    + weak.title()
                                    + " is "
                                    + weak.value()
                                    + " out of 100. Ask the trainer to find the gaps with you.",
                            new Action(
                                    "ask_ai",
                                    "Ask AI",
                                    weak.topicId(),
                                    null,
                                    null,
                                    "Help me get better at "
                                            + weak.title()
                                            + ". Ask me a few short questions to find what I am"
                                            + " missing, then explain those parts simply.")));
        }

        TopicRef mistakes = in.quizMistakes();
        if (in.askAiOn()
                && mistakes != null
                && mistakes.value() != null
                && mistakes.value() < QUIZ_MISTAKES_BELOW
                && !(weakShown && Objects.equals(mistakes.topicId(), weak.topicId()))) {
            out.add(
                    new Nudge(
                            "quiz_mistakes",
                            "Quiz mistakes in " + mistakes.title(),
                            "You got "
                                    + mistakes.value()
                                    + "% of the "
                                    + mistakes.title()
                                    + " quiz questions right. A fresh explanation may help.",
                            new Action(
                                    "ask_ai",
                                    "Explain it again",
                                    mistakes.topicId(),
                                    null,
                                    null,
                                    "Explain "
                                            + mistakes.title()
                                            + " again, simply. I keep getting its quiz questions"
                                            + " wrong, so focus on the parts people usually mix"
                                            + " up.")));
        }

        if (!in.hasGoal()) {
            out.add(
                    new Nudge(
                            "set_goal",
                            "Set your goal",
                            "Tell the trainer the role you want and by when, and it plans your"
                                    + " weeks around it.",
                            Action.simple("open_trainer", "Set goal")));
        }

        if (in.resumeOn() && !in.hasResume() && in.targetDate() != null && in.today() != null) {
            long daysLeft = ChronoUnit.DAYS.between(in.today(), in.targetDate());
            if (daysLeft >= 0 && daysLeft <= RESUME_WITHIN_DAYS) {
                out.add(
                        new Nudge(
                                "upload_resume",
                                "Get your resume reviewed",
                                "Your target date is "
                                        + daysLeft
                                        + " days away. Upload your resume for a review and"
                                        + " practise interviews built around it.",
                                Action.simple("upload_resume", "Upload resume")));
            }
        }

        return out.size() > MAX_NUDGES ? List.copyOf(out.subList(0, MAX_NUDGES)) : out;
    }
}
