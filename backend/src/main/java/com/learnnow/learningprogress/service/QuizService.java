package com.learnnow.learningprogress.service;

import com.learnnow.admin.entity.QuizQuestion;
import com.learnnow.admin.repository.QuizQuestionRepository;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.learningprogress.dto.request.QuizSubmitRequest;
import com.learnnow.learningprogress.dto.response.QuizSubmitResponse;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserQuizAttempt;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import java.time.ZoneId;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grades quiz submissions.
 *
 * <p>Grading is server-side: the client sends only the option it picked and never the verdict.
 * Scoring is first-attempt-only, recorded in {@code user_quiz_attempts} - previously nothing
 * tracked that a question had been answered, so the same correct submission could be replayed for
 * unlimited points, and the response revealed the correct answer even when the submission was
 * wrong.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private static final int DEFAULT_POINTS = 5;

    private final QuizQuestionRepository quizQuestionRepository;
    private final UserQuizAttemptRepository attemptRepository;
    private final ActivityRecordingService activityRecordingService;
    private final UserLearningPreferencesRepository preferencesRepository;

    @Transactional
    public QuizSubmitResponse validateAndSubmitQuiz(String userId, QuizSubmitRequest request) {
        QuizQuestion question =
                quizQuestionRepository
                        .findById(request.questionId())
                        .orElseThrow(() -> new NotFoundException("quiz_question_not_found"));

        String expected =
                question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";
        String actual = request.selectedOption() != null ? request.selectedOption().trim() : "";
        boolean isCorrect = expected.equalsIgnoreCase(actual);

        Optional<UserQuizAttempt> existing =
                attemptRepository.findByUserIdAndQuestionId(userId, request.questionId());

        if (existing.isPresent()) {
            // Already answered: grade it for feedback, award nothing.
            return respond(question, isCorrect, 0, true);
        }

        int pointsEarned = isCorrect ? resolvePoints(question) : 0;

        try {
            attemptRepository.save(
                    UserQuizAttempt.builder()
                            .userId(userId)
                            .questionId(request.questionId())
                            .correct(isCorrect)
                            .pointsAwarded(pointsEarned)
                            .build());
            attemptRepository.flush();
        } catch (DataIntegrityViolationException e) {
            // Two concurrent submissions for the same question; the unique constraint
            // settled which one counts. Award nothing for the loser.
            log.debug("Concurrent first attempt for question {}", request.questionId());
            return respond(question, isCorrect, 0, true);
        }

        if (pointsEarned > 0) {
            UserLearningPreferences prefs = loadOrCreatePreferences(userId);
            activityRecordingService.recordDailyPoints(
                    userId, ZoneId.of(prefs.getTimezone()), pointsEarned, prefs);
        }

        return respond(question, isCorrect, pointsEarned, false);
    }

    /**
     * The correct answer and explanation are released only once the question is settled - either
     * answered correctly, or already attempted so no further points are available.
     */
    private QuizSubmitResponse respond(
            QuizQuestion question, boolean isCorrect, int pointsEarned, boolean alreadyAttempted) {
        boolean reveal = isCorrect || alreadyAttempted;
        return new QuizSubmitResponse(
                question.getId(),
                isCorrect,
                reveal ? question.getCorrectAnswer() : null,
                reveal ? question.getExplanation() : null,
                pointsEarned,
                alreadyAttempted);
    }

    private int resolvePoints(QuizQuestion question) {
        return question.getPoints() > 0 ? question.getPoints() : DEFAULT_POINTS;
    }

    private UserLearningPreferences loadOrCreatePreferences(String userId) {
        return preferencesRepository
                .findByUserId(userId)
                .orElseGet(
                        () ->
                                preferencesRepository.save(
                                        UserLearningPreferences.builder().userId(userId).build()));
    }
}
