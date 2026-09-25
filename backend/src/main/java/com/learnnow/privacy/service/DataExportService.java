package com.learnnow.privacy.service;

import com.learnnow.common.exception.NotFoundException;
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
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.time.Instant;
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
    private final NoteRepository noteRepository;
    private final BookmarkRepository bookmarkRepository;

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
                                .toList());

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
                        .toList());
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
