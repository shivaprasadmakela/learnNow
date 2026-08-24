package com.learnnow.dsa.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.dsa.dao.DsaProgressDao;
import com.learnnow.dsa.dto.response.DsaProblemProgressDto;
import com.learnnow.dsa.entity.DsaDifficulty;
import com.learnnow.dsa.entity.DsaProblemStatus;
import com.learnnow.dsa.entity.DsaProgressStatus;
import com.learnnow.dsa.entity.UserDsaProblemProgress;
import com.learnnow.dsa.repository.DsaProblemRepository;
import com.learnnow.dsa.repository.DsaStepRepository;
import com.learnnow.dsa.repository.UserDsaProblemProgressRepository;
import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.service.ActivityRecordingService;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns every write to a learner's DSA progress, and every point that follows from one.
 *
 * <p>Points go through {@link ActivityRecordingService#recordDailyPoints}, never straight to a
 * counter. There are two counters - the daily activity row behind the streak calendar and
 * leaderboard, and {@code preferences.total_points} behind the gem count in the header - and they
 * have already drifted apart once in this codebase. That method is the one place that updates both.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DsaProgressService {

    private final UserDsaProblemProgressRepository progressRepository;
    private final DsaProblemRepository problemRepository;
    private final DsaStepRepository stepRepository;
    private final DsaProgressDao progressDao;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final ActivityRecordingService activityRecordingService;

    /** What a status write actually did, so the caller can decide whether to celebrate. */
    public record ProgressOutcome(boolean newlySolved, int pointsAwarded) {}

    @Transactional(readOnly = true)
    public DsaProblemProgressDto progressFor(String userId, UUID problemId) {
        if (userId == null || userId.isBlank()) return DsaProblemProgressDto.notStarted();
        return progressRepository
                .findByUserIdAndProblemId(userId, problemId)
                .map(
                        p ->
                                new DsaProblemProgressDto(
                                        p.getStatus().name(),
                                        p.getAttemptCount(),
                                        p.getLastLanguage()))
                .orElseGet(DsaProblemProgressDto::notStarted);
    }

    /** Records that the learner ran code, without claiming they solved anything. */
    @Transactional
    public void recordAttempt(String userId, UUID problemId, String language) {
        UserDsaProblemProgress progress = loadOrCreate(userId, problemId);
        progress.setAttemptCount(progress.getAttemptCount() + 1);
        progress.setLastLanguage(language);
        if (progress.getStatus() == DsaProgressStatus.NOT_STARTED) {
            progress.setStatus(DsaProgressStatus.ATTEMPTED);
        }
        progressRepository.save(progress);
    }

    /**
     * Marks a problem solved and awards for it.
     *
     * <p>{@code solvedAt} is the once-ever guard. Un-solving deliberately does not claw points
     * back: the topic flow does not either, and a learner correcting a mis-tap should not be
     * punished.
     */
    @Transactional
    public ProgressOutcome setStatus(
            String userId, UUID problemId, DsaProgressStatus status, String language) {

        DsaDifficulty difficulty =
                problemRepository
                        .findDifficultyById(problemId)
                        .orElseThrow(() -> new NotFoundException("dsa_problem_not_found"));

        UserDsaProblemProgress progress = loadOrCreate(userId, problemId);
        boolean alreadyAwarded = progress.getSolvedAt() != null;

        progress.setStatus(status);
        if (language != null && !language.isBlank()) {
            progress.setLastLanguage(language);
        }

        if (status != DsaProgressStatus.SOLVED) {
            progressRepository.save(progress);
            return new ProgressOutcome(false, 0);
        }

        if (alreadyAwarded) {
            progressRepository.save(progress);
            return new ProgressOutcome(false, 0);
        }

        progress.setSolvedAt(Instant.now());
        progressRepository.save(progress);

        int points = pointsFor(difficulty) + completionBonuses(userId, problemId);
        award(userId, points);
        return new ProgressOutcome(true, points);
    }

    /** Awards for a correct inline check. Routed through the same seam as everything else. */
    @Transactional
    public void awardCheckPoints(String userId, int points) {
        if (points > 0) award(userId, points);
    }

    public static int pointsFor(DsaDifficulty difficulty) {
        return switch (difficulty) {
            case EASY -> PointsConfig.DSA_SOLVED_EASY;
            case MEDIUM -> PointsConfig.DSA_SOLVED_MEDIUM;
            case HARD -> PointsConfig.DSA_SOLVED_HARD;
        };
    }

    /**
     * Step- and sheet-completion bonuses, if this solve was the one that finished either.
     *
     * <p>Called after the solve is persisted, so the counts it reads include it.
     */
    private int completionBonuses(String userId, UUID problemId) {
        Optional<UUID> stepId = problemRepository.findStepIdByProblemId(problemId);
        Optional<UUID> sheetId = problemRepository.findSheetIdByProblemId(problemId);
        if (stepId.isEmpty() || sheetId.isEmpty()) return 0;

        int bonus = 0;

        Map<UUID, Long> stepTotals = progressDao.totalCountPerStep(sheetId.get());
        long stepTotal = stepTotals.getOrDefault(stepId.get(), 0L);
        long stepSolved = progressRepository.countSolvedByUserIdAndStepId(userId, stepId.get());
        if (stepTotal > 0 && stepSolved >= stepTotal) {
            bonus += PointsConfig.DSA_STEP_COMPLETED_BONUS;

            long sheetTotal =
                    problemRepository.countBySheetIdAndStatus(
                            sheetId.get(), DsaProblemStatus.PUBLISHED);
            long sheetSolved =
                    progressDao.solvedCountPerStep(userId, sheetId.get()).values().stream()
                            .mapToLong(Long::longValue)
                            .sum();
            if (sheetTotal > 0 && sheetSolved >= sheetTotal) {
                bonus += PointsConfig.DSA_SHEET_COMPLETED_BONUS;
            }
        }
        return bonus;
    }

    private void award(String userId, int points) {
        UserLearningPreferences prefs = loadOrCreatePreferences(userId);
        activityRecordingService.recordDailyPoints(
                userId, ZoneId.of(prefs.getTimezone()), points, prefs);
    }

    private UserDsaProblemProgress loadOrCreate(String userId, UUID problemId) {
        return progressRepository
                .findByUserIdAndProblemId(userId, problemId)
                .orElseGet(
                        () ->
                                UserDsaProblemProgress.builder()
                                        .userId(userId)
                                        .problemId(problemId)
                                        .build());
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
