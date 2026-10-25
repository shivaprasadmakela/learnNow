package com.learnnow.privacy.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.dsa.repository.UserDsaCheckAttemptRepository;
import com.learnnow.dsa.repository.UserDsaProblemProgressRepository;
import com.learnnow.dsa.repository.UserDsaSubmissionRepository;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.notes.repository.BookmarkRepository;
import com.learnnow.notes.repository.NoteRepository;
import com.learnnow.privacy.dto.response.DataExportResponse;
import com.learnnow.privacy.repository.UserConsentEventRepository;
import com.learnnow.trainer.dto.GoalResponse;
import com.learnnow.trainer.dto.NoteResponse;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.entity.TopicInterviewAnswer;
import com.learnnow.trainer.interview.entity.TopicInterviewTurn;
import com.learnnow.trainer.interview.repository.TopicInterviewAnswerRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewTurnRepository;
import com.learnnow.trainer.repository.LearnerGoalRepository;
import com.learnnow.trainer.repository.TrainerNoteRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The right to access, s.11.
 *
 * <p>Assembles everything held about one learner into a single document they can download. It is
 * deliberately a read across the live tables rather than a queued job writing a file: the data
 * volume for one learner is small — hundreds of rows, not millions — and a synchronous answer means
 * the right is exercised by clicking a button, not by clicking a button and then waiting for an
 * email that may never arrive.
 *
 * <p>If that stops being true, the thing to change is this class, not the endpoint contract: it
 * would become a job that produces the same {@link DataExportResponse} shape.
 */
@Service
@RequiredArgsConstructor
public class DataExportService {

    private final UserRepository userRepository;
    private final ConsentService consentService;
    private final NomineeService nomineeService;
    private final GrievanceService grievanceService;
    private final PrivacyNoticeService privacyNotice;
    private final UserConsentEventRepository consentEventRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserQuizAttemptRepository quizAttemptRepository;
    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserDsaProblemProgressRepository dsaProgressRepository;
    private final UserDsaSubmissionRepository dsaSubmissionRepository;
    private final UserDsaCheckAttemptRepository dsaCheckAttemptRepository;
    private final NoteRepository noteRepository;
    private final BookmarkRepository bookmarkRepository;
    private final LearnerGoalRepository learnerGoalRepository;
    private final TrainerNoteRepository trainerNoteRepository;
    private final TopicInterviewRepository interviewRepository;
    private final TopicInterviewTurnRepository interviewTurnRepository;
    private final TopicInterviewAnswerRepository interviewAnswerRepository;

    @Transactional(readOnly = true)
    public DataExportResponse export(String userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new NotFoundException("user_not_found"));

        DataExportResponse.Learning learning =
                new DataExportResponse.Learning(
                        preferencesRepository
                                .findById(userId)
                                .map(DataExportResponse.Preferences::from)
                                .orElse(null),
                        topicProgressRepository.findByUserId(userId).stream()
                                .map(DataExportResponse.TopicProgress::from)
                                .toList(),
                        subtopicProgressRepository.findByUserId(userId).stream()
                                .map(DataExportResponse.SubtopicProgress::from)
                                .toList(),
                        quizAttemptRepository.findByUserId(userId).stream()
                                .map(DataExportResponse.QuizAttempt::from)
                                .toList(),
                        dailyActivityRepository.findByUserIdOrderByActivityDateDesc(userId).stream()
                                .map(DataExportResponse.DailyActivity::from)
                                .toList());

        DataExportResponse.Dsa dsa =
                new DataExportResponse.Dsa(
                        dsaProgressRepository.findByUserId(userId).stream()
                                .map(DataExportResponse.DsaProgress::from)
                                .toList(),
                        dsaSubmissionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                                .map(DataExportResponse.DsaSubmission::from)
                                .toList(),
                        dsaCheckAttemptRepository.findByUserId(userId).stream()
                                .map(DataExportResponse.DsaCheckAttempt::from)
                                .toList());

        List<TopicInterview> interviews =
                interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<UUID> interviewIds = interviews.stream().map(TopicInterview::getId).toList();
        Map<UUID, List<TopicInterviewTurn>> turnsByInterview =
                interviewTurnRepository.findByInterviewIdIn(interviewIds).stream()
                        .collect(Collectors.groupingBy(TopicInterviewTurn::getInterviewId));
        Map<UUID, List<TopicInterviewAnswer>> answersByInterview =
                interviewAnswerRepository.findByInterviewIdIn(interviewIds).stream()
                        .collect(Collectors.groupingBy(TopicInterviewAnswer::getInterviewId));

        List<DataExportResponse.TopicInterviewEntry> interviewEntries =
                interviews.stream()
                        .map(
                                i ->
                                        new DataExportResponse.TopicInterviewEntry(
                                                i.getId(),
                                                i.getTopicId(),
                                                i.getStatus().name(),
                                                i.getOverallScore(),
                                                i.getPointsAwarded(),
                                                i.getCreatedAt(),
                                                i.getCompletedAt(),
                                                turnsByInterview
                                                        .getOrDefault(i.getId(), List.of())
                                                        .stream()
                                                        .map(
                                                                t ->
                                                                        new DataExportResponse
                                                                                .TopicInterviewTurnEntry(
                                                                                t.getSeq(),
                                                                                t.getRole(),
                                                                                t.getText(),
                                                                                t.getQuestionId(),
                                                                                t.getCreatedAt()))
                                                        .toList(),
                                                answersByInterview
                                                        .getOrDefault(i.getId(), List.of())
                                                        .stream()
                                                        .map(
                                                                a ->
                                                                        new DataExportResponse
                                                                                .TopicInterviewAnswerEntry(
                                                                                a.getQuestionId(),
                                                                                a.getSubtopicId(),
                                                                                a.getPrompt(),
                                                                                a.getScore(),
                                                                                a.getGood(),
                                                                                a.getMissing(),
                                                                                a.getEvidence(),
                                                                                a.getCreatedAt()))
                                                        .toList()))
                        .toList();

        return new DataExportResponse(
                Instant.now(),
                privacyNotice.currentVersion(),
                DataExportResponse.Account.from(user),
                consentService.getConsentCentre(userId).consents(),
                consentEventRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(DataExportResponse.ConsentEvent::from)
                        .toList(),
                nomineeService.getNominee(userId).orElse(null),
                grievanceService.getGrievances(userId),
                learning,
                dsa,
                noteRepository.findAllByUserId(userId).stream()
                        .map(DataExportResponse.NoteEntry::from)
                        .toList(),
                bookmarkRepository.findAllByUserId(userId).stream()
                        .map(DataExportResponse.BookmarkEntry::from)
                        .toList(),
                new DataExportResponse.Trainer(
                        learnerGoalRepository.findById(userId).map(GoalResponse::from).orElse(null),
                        trainerNoteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                                .map(NoteResponse::from)
                                .toList(),
                        interviewEntries));
    }

    /**
     * The filename the browser saves it under. Dated so a learner who exports twice can tell the
     * two apart, and free of the account id, which they did not ask to have written into a file in
     * their downloads folder.
     */
    public String exportFilename() {
        return "learnnow-my-data-" + java.time.LocalDate.now() + ".json";
    }
}
