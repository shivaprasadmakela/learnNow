package com.learnnow.learningprogress.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnnow.admin.entity.QuizQuestion;
import com.learnnow.admin.repository.QuizQuestionRepository;
import com.learnnow.learningprogress.dto.request.QuizSubmitRequest;
import com.learnnow.learningprogress.dto.response.QuizSubmitResponse;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserQuizAttempt;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Regression cover for the unbounded quiz point farming found in the audit. */
class QuizServiceTest {

    private static final String USER = "u-1";

    private QuizQuestionRepository quizQuestionRepository;
    private UserQuizAttemptRepository attemptRepository;
    private ActivityRecordingService activityRecordingService;
    private UserLearningPreferencesRepository preferencesRepository;
    private QuizService quizService;

    private UUID questionId;
    private QuizQuestion question;

    @BeforeEach
    void setUp() {
        quizQuestionRepository = Mockito.mock(QuizQuestionRepository.class);
        attemptRepository = Mockito.mock(UserQuizAttemptRepository.class);
        activityRecordingService = Mockito.mock(ActivityRecordingService.class);
        preferencesRepository = Mockito.mock(UserLearningPreferencesRepository.class);

        quizService =
                new QuizService(
                        quizQuestionRepository,
                        attemptRepository,
                        activityRecordingService,
                        preferencesRepository);

        questionId = UUID.randomUUID();
        question = new QuizQuestion();
        question.setId(questionId);
        question.setCorrectAnswer("B");
        question.setExplanation("Because B.");
        question.setPoints(10);

        when(quizQuestionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(preferencesRepository.findByUserId(USER))
                .thenReturn(
                        Optional.of(
                                UserLearningPreferences.builder()
                                        .userId(USER)
                                        .timezone("Asia/Kolkata")
                                        .build()));
    }

    @Test
    @DisplayName("a first correct answer earns its points")
    void firstCorrectAttemptEarnsPoints() {
        when(attemptRepository.findByUserIdAndQuestionId(USER, questionId))
                .thenReturn(Optional.empty());

        QuizSubmitResponse res =
                quizService.validateAndSubmitQuiz(USER, new QuizSubmitRequest(questionId, "B"));

        assertTrue(res.isCorrect());
        assertEquals(10, res.pointsEarned());
        assertFalse(res.alreadyAttempted());
        verify(activityRecordingService)
                .recordDailyPoints(anyString(), any(ZoneId.class), anyInt(), any());
    }

    @Test
    @DisplayName("resubmitting the same question earns nothing")
    void repeatAttemptEarnsNoPoints() {
        when(attemptRepository.findByUserIdAndQuestionId(USER, questionId))
                .thenReturn(
                        Optional.of(
                                UserQuizAttempt.builder()
                                        .userId(USER)
                                        .questionId(questionId)
                                        .correct(true)
                                        .pointsAwarded(10)
                                        .build()));

        QuizSubmitResponse res =
                quizService.validateAndSubmitQuiz(USER, new QuizSubmitRequest(questionId, "B"));

        assertTrue(res.isCorrect());
        // The whole point of the fix: replaying a correct answer no longer pays out.
        assertEquals(0, res.pointsEarned());
        assertTrue(res.alreadyAttempted());
        verify(activityRecordingService, never())
                .recordDailyPoints(anyString(), any(ZoneId.class), anyInt(), any());
    }

    @Test
    @DisplayName("a wrong answer does not disclose the correct one")
    void wrongAnswerWithholdsTheCorrectAnswer() {
        when(attemptRepository.findByUserIdAndQuestionId(USER, questionId))
                .thenReturn(Optional.empty());

        QuizSubmitResponse res =
                quizService.validateAndSubmitQuiz(USER, new QuizSubmitRequest(questionId, "A"));

        assertFalse(res.isCorrect());
        assertEquals(0, res.pointsEarned());
        // Previously returned unconditionally, so one deliberate miss handed over the
        // answer and the next submission collected the points.
        assertNull(res.correctAnswer());
        assertNull(res.explanation());
    }
}
