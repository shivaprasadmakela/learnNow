package com.learnnow.privacy.dto.response;

import com.learnnow.dsa.entity.UserDsaCheckAttempt;
import com.learnnow.dsa.entity.UserDsaProblemProgress;
import com.learnnow.dsa.entity.UserDsaSubmission;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserQuizAttempt;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.notes.entity.Bookmark;
import com.learnnow.notes.entity.Note;
import com.learnnow.user.entity.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * The full export payload for a learner's right to access (s.11 of the DPDP Act).
 *
 * <p>Every personal datum held about them is represented here under its domain object. We
 * deliberately avoid nesting into internal database foreign keys where a flat, human-scannable
 * structure is clearer to someone reading their own file.
 */
public record DataExportResponse(
        Instant exportedAt,
        String privacyNoticeVersion,
        Account account,
        List<ConsentResponse> consents,
        List<ConsentEvent> consentHistory,
        NomineeResponse nominee,
        List<GrievanceResponse> grievances,
        Learning learning,
        Dsa dsa,
        List<NoteEntry> notes,
        List<BookmarkEntry> bookmarks,
        Trainer trainer) {

    /**
     * What the AI trainer holds: the goal the learner set, notes it drew from their conversations,
     * and practice interviews.
     */
    public record Trainer(
            com.learnnow.trainer.dto.GoalResponse goal,
            List<com.learnnow.trainer.dto.NoteResponse> notes,
            List<TopicInterviewEntry> topicInterviews) {

        public Trainer(
                com.learnnow.trainer.dto.GoalResponse goal,
                List<com.learnnow.trainer.dto.NoteResponse> notes) {
            this(goal, notes, List.of());
        }
    }

    public record TopicInterviewEntry(
            UUID id,
            UUID topicId,
            String status,
            Integer overallScore,
            int pointsAwarded,
            Instant createdAt,
            Instant completedAt,
            List<TopicInterviewTurnEntry> turns,
            List<TopicInterviewAnswerEntry> answers) {}

    public record TopicInterviewTurnEntry(
            int seq, String role, String text, UUID questionId, Instant createdAt) {}

    public record TopicInterviewAnswerEntry(
            UUID questionId,
            UUID subtopicId,
            String prompt,
            Integer score,
            String good,
            String missing,
            String evidence,
            Instant createdAt) {}

    /** The account itself, minus anything that would be a credential. */
    public record Account(
            String id,
            String email,
            String fullName,
            String firstName,
            String lastName,
            String bio,
            String avatar,
            String role,
            boolean emailVerified,
            boolean hasPassword,
            boolean hasGoogleSignIn,
            Instant createdAt,
            Instant updatedAt) {

        public static Account from(User user) {
            return new Account(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getBio(),
                    user.getAvatar(),
                    user.getRole(),
                    user.isEmailVerified(),
                    user.getPasswordHash() != null,
                    user.getGoogleSub() != null,
                    user.getCreatedAt(),
                    user.getUpdatedAt());
        }
    }

    public record ConsentEvent(
            String purpose,
            boolean granted,
            String noticeVersion,
            String source,
            Instant createdAt) {

        public static ConsentEvent from(com.learnnow.privacy.entity.UserConsentEvent event) {
            return new ConsentEvent(
                    event.getPurpose().name(),
                    event.isGranted(),
                    event.getNoticeVersion(),
                    event.getSource().name(),
                    event.getCreatedAt());
        }
    }

    public record Learning(
            Preferences preferences,
            List<TopicProgress> topicProgress,
            List<SubtopicProgress> subtopicProgress,
            List<QuizAttempt> quizAttempts,
            List<DailyActivity> dailyActivity) {}

    public record Preferences(
            String timezone,
            int currentStreak,
            int longestStreak,
            LocalDate lastActivityDate,
            int totalPoints) {

        public static Preferences from(UserLearningPreferences prefs) {
            return new Preferences(
                    prefs.getTimezone(),
                    prefs.getCurrentStreak(),
                    prefs.getLongestStreak(),
                    prefs.getLastActivityDate(),
                    prefs.getTotalPoints());
        }
    }

    public record TopicProgress(UUID topicId, UUID pathId, String status, Instant completedAt) {

        public static TopicProgress from(UserTopicProgress progress) {
            return new TopicProgress(
                    progress.getTopicId(),
                    progress.getPathId(),
                    progress.getStatus().name(),
                    progress.getCompletedAt());
        }
    }

    public record SubtopicProgress(
            UUID subtopicId,
            UUID topicId,
            boolean completed,
            Instant completedAt,
            Integer contentVersionAnswered,
            Boolean firstAttemptCorrect) {

        public static SubtopicProgress from(UserSubtopicProgress progress) {
            return new SubtopicProgress(
                    progress.getSubtopicId(),
                    progress.getTopicId(),
                    progress.isCompleted(),
                    progress.getCompletedAt(),
                    progress.getContentVersionAnswered(),
                    progress.getFirstAttemptCorrect());
        }
    }

    public record QuizAttempt(
            UUID questionId, boolean correct, int pointsAwarded, Instant attemptedAt) {

        public static QuizAttempt from(UserQuizAttempt attempt) {
            return new QuizAttempt(
                    attempt.getQuestionId(),
                    attempt.isCorrect(),
                    attempt.getPointsAwarded(),
                    attempt.getAttemptedAt());
        }
    }

    public record DailyActivity(
            LocalDate activityDate,
            Instant firstActivityAt,
            Instant lastActivityAt,
            int qualifyingEventCount,
            int pointsEarned) {

        public static DailyActivity from(UserLearningDailyActivity activity) {
            return new DailyActivity(
                    activity.getActivityDate(),
                    activity.getFirstActivityAt(),
                    activity.getLastActivityAt(),
                    activity.getQualifyingEventCount(),
                    activity.getPointsEarned());
        }
    }

    public record Dsa(
            List<DsaProgress> progress,
            List<DsaSubmission> submissions,
            List<DsaCheckAttempt> checkAttempts) {}

    public record DsaProgress(
            UUID problemId,
            String status,
            int attemptCount,
            String lastLanguage,
            Instant solvedAt) {

        public static DsaProgress from(UserDsaProblemProgress progress) {
            return new DsaProgress(
                    progress.getProblemId(),
                    progress.getStatus().name(),
                    progress.getAttemptCount(),
                    progress.getLastLanguage(),
                    progress.getSolvedAt());
        }
    }

    public record DsaCheckAttempt(
            UUID checkId, boolean correct, int pointsAwarded, Instant attemptedAt) {

        public static DsaCheckAttempt from(UserDsaCheckAttempt attempt) {
            return new DsaCheckAttempt(
                    attempt.getCheckId(),
                    attempt.isCorrect(),
                    attempt.getPointsAwarded(),
                    attempt.getAttemptedAt());
        }
    }

    /**
     * The learner's own submitted code is theirs, so it is exported in full rather than counted.
     */
    public record DsaSubmission(
            UUID problemId,
            String language,
            String code,
            String verdict,
            int passedCount,
            int totalCount,
            Instant createdAt) {

        public static DsaSubmission from(UserDsaSubmission submission) {
            return new DsaSubmission(
                    submission.getProblemId(),
                    submission.getLanguage(),
                    submission.getCode(),
                    submission.getVerdict().name(),
                    submission.getPassedCount(),
                    submission.getTotalCount(),
                    submission.getCreatedAt());
        }
    }

    public record NoteEntry(
            String target, UUID targetId, String content, Instant createdAt, Instant updatedAt) {

        public static NoteEntry from(Note note) {
            return new NoteEntry(
                    note.getTarget().name(),
                    note.getTargetId(),
                    note.getContent(),
                    note.getCreatedAt(),
                    note.getUpdatedAt());
        }
    }

    public record BookmarkEntry(String target, UUID targetId, Instant createdAt) {

        public static BookmarkEntry from(Bookmark bookmark) {
            return new BookmarkEntry(
                    bookmark.getTarget().name(), bookmark.getTargetId(), bookmark.getCreatedAt());
        }
    }
}
