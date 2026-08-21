package com.learnnow.learningprogress.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.repository.TopicRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/**
 * Points live in two places: the daily row behind the streak calendar and leaderboard, and the
 * lifetime total behind the gem count. They drifted apart because only one was being written.
 */
class ActivityRecordingServiceTest {

    private static final String USER = "u-1";
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private UserLearningDailyActivityRepository dailyRepo;
    private UserLearningPreferencesRepository prefsRepo;
    private ActivityRecordingService service;
    private UserLearningPreferences prefs;

    @BeforeEach
    void setUp() {
        dailyRepo = Mockito.mock(UserLearningDailyActivityRepository.class);
        prefsRepo = Mockito.mock(UserLearningPreferencesRepository.class);
        service =
                new ActivityRecordingService(
                        dailyRepo,
                        prefsRepo,
                        Mockito.mock(UserTopicProgressRepository.class),
                        Mockito.mock(TopicRepository.class),
                        new StreakService());
        prefs = UserLearningPreferences.builder().userId(USER).timezone(ZONE.getId()).build();
        when(dailyRepo.findByUserIdAndActivityDate(any(), any())).thenReturn(Optional.empty());
        when(dailyRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(prefsRepo.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    @DisplayName("an award lands on both the lifetime total and the daily row")
    void awardHitsBothCounters() {
        service.recordDailyPoints(USER, ZONE, 5, prefs);

        assertEquals(5, prefs.getTotalPoints(), "lifetime total must be credited");

        var captor = org.mockito.ArgumentCaptor.forClass(UserLearningDailyActivity.class);
        Mockito.verify(dailyRepo).save(captor.capture());
        assertEquals(5, captor.getValue().getPointsEarned(), "daily row must be credited");
    }

    @Test
    @DisplayName("repeated awards accumulate on the lifetime total")
    void awardsAccumulate() {
        // Six subtopic completions at 5 points each - the case that showed 0 gems while the
        // leaderboard showed 30.
        for (int i = 0; i < 6; i++) {
            service.recordDailyPoints(USER, ZONE, 5, prefs);
        }
        assertEquals(30, prefs.getTotalPoints());
    }

    @Test
    @DisplayName("a zero award still records activity but does not change the total")
    void zeroAwardKeepsTotalButMarksActivity() {
        service.recordDailyPoints(USER, ZONE, 0, prefs);
        assertEquals(0, prefs.getTotalPoints());
        assertEquals(LocalDate.now(ZONE), prefs.getLastActivityDate());
    }
}
