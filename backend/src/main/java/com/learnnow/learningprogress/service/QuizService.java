package com.learnnow.learningprogress.service;

import com.learnnow.admin.entity.QuizQuestion;
import com.learnnow.admin.repository.QuizQuestionRepository;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.learningprogress.dto.QuizSubmitRequest;
import com.learnnow.learningprogress.dto.QuizSubmitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizQuestionRepository quizQuestionRepository;
    private final ActivityRecordingService activityRecordingService;
    private final UserLearningPreferencesRepository preferencesRepository;

    @Transactional
    public QuizSubmitResponse validateAndSubmitQuiz(String userId, QuizSubmitRequest request) {
        QuizQuestion question = quizQuestionRepository.findById(request.questionId())
                .orElseThrow(() -> new NotFoundException("Quiz question not found with ID: " + request.questionId()));

        String expected = question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";
        String actual = request.selectedOption() != null ? request.selectedOption().trim() : "";

        boolean isCorrect = expected.equalsIgnoreCase(actual);
        int pointsEarned = 0;

        if (isCorrect) {
            pointsEarned = question.getPoints() > 0 ? question.getPoints() : 5;
            if (userId != null && !userId.isBlank()) {
                // Load prefs once and pass to avoid duplicate lookup in
                // activityRecordingService
                UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                        .orElseGet(() -> UserLearningPreferences.builder()
                                .userId(userId)
                                .build());
                activityRecordingService.recordDailyPoints(userId, ZoneId.of(prefs.getTimezone()), pointsEarned, prefs);
            }
        }

        return new QuizSubmitResponse(
                question.getId(),
                isCorrect,
                question.getCorrectAnswer(),
                question.getExplanation(),
                pointsEarned);
    }
}
