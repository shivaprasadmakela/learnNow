package com.learnnow.privacy.dto.response;

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
 * Everything held about one learner, as s.11 requires it to be available to them.
 *
 * <p>The Act asks for a summary of the personal data being processed and of the processing
 * activities. This goes further and returns the data itself, because a summary of "your quiz
 * attempts" is less useful to a person than their quiz attempts, and the honest answer to "what do
 * you have on me" is the contents.
 *
 * <p>Three deliberate omissions, each of which would otherwise look like a gap:
 *
 * <ul>
 *   <li><b>Credentials.</b> The password hash and the Google subject identifier are not included.
 *       Neither tells the learner anything they do not know, and an export is a file that ends up
 *       in inboxes and downloads folders. {@code hasPassword} and {@code hasGoogleSignIn} say
 *       whether each exists, which is the part that is actually informative.
 *   <li><b>Session tokens.</b> Refresh, reset and verification tokens are stored hashed, are
 *       short-lived, and exist to run the account rather than to describe the person.
 *   <li><b>Donations.</b> Payment records are keyed by donor email rather than by account and are
 *       retained under tax law, so they are reported as a count and their amounts, not as rows to
 *       be erased along with everything else. See AccountErasureService.
 * </ul>
 */
public record DataExportResponse(
        Instant exportedAt,
        String noticeVersion,
        Account account,
        List<ConsentResponse> consents,
        List<ConsentEvent> consentHistory,
        NomineeResponse nominee,
        List<GrievanceResponse> grievances,
        Learning learning,
        Dsa dsa,
        List<NoteEntry> notes,
        List<BookmarkEntry> bookmarks) {

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

    public record Dsa(List<DsaProgress> progress, List<DsaSubmission> submissions) {}

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
