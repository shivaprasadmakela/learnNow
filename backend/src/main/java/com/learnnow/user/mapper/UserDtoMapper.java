package com.learnnow.user.mapper;

import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.user.dto.response.UserDto;
import com.learnnow.user.entity.User;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Single source of truth for turning a {@link User} into the API-facing {@link UserDto}, including
 * the derived gamification metrics. Shared by the auth and profile flows so the two can never drift
 * apart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserDtoMapper {

    static final String DEFAULT_TIMEZONE = "Asia/Kolkata";

    private final UserLearningPreferencesRepository preferencesRepository;

    public UserDto toDto(User user) {
        int streakCount = 0;
        int gemsCount = 0;

        UserLearningPreferences prefs =
                preferencesRepository.findByUserId(user.getId()).orElse(null);
        if (prefs != null) {
            streakCount = prefs.getCurrentStreakForDate(LocalDate.now(resolveZone(prefs, user)));
            gemsCount = prefs.getTotalPoints();
        }

        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatar(),
                user.getRole(),
                user.getBio(),
                streakCount,
                gemsCount);
    }

    private ZoneId resolveZone(UserLearningPreferences prefs, User user) {
        String tz = prefs.getTimezone() != null ? prefs.getTimezone() : DEFAULT_TIMEZONE;
        try {
            return ZoneId.of(tz);
        } catch (Exception e) {
            log.warn(
                    "Invalid timezone '{}' stored for user {}; falling back to {}",
                    tz,
                    user.getId(),
                    DEFAULT_TIMEZONE);
            return ZoneId.of(DEFAULT_TIMEZONE);
        }
    }
}
