package com.learnnow.user.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.user.dto.request.*;
import com.learnnow.user.dto.response.*;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserLearningPreferencesRepository preferencesRepository;

    public UserService(
            UserRepository userRepository,
            UserLearningPreferencesRepository preferencesRepository) {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
    }

    public UserDto getOrCreateUser(String id, String email) {
        User user =
                userRepository
                        .findById(id)
                        .orElseGet(
                                () -> {
                                    User newUser =
                                            User.builder()
                                                    .id(id)
                                                    .email(email)
                                                    .fullName(
                                                            email != null && email.contains("@")
                                                                    ? email.split("@")[0]
                                                                    : "New Learner")
                                                    .avatar(UUID.randomUUID().toString())
                                                    .passwordHash("")
                                                    .build();
                                    return userRepository.save(newUser);
                                });

        return buildUserDto(user);
    }

    @Transactional
    public UserDto updateUser(String id, UpdateProfileRequest req) {
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() -> new NotFoundException("user_not_found"));

        if (req.fullName() != null && !req.fullName().isBlank()) {
            user.setFullName(req.fullName());
        }
        if (req.avatar() != null) user.setAvatar(req.avatar());
        if (req.bio() != null) user.setBio(req.bio());

        User updated = userRepository.save(user);
        return buildUserDto(updated);
    }

    private UserDto buildUserDto(User user) {
        int streakCount = 0;
        int gemsCount = 0;

        try {
            UserLearningPreferences prefs =
                    preferencesRepository.findByUserId(user.getId()).orElse(null);
            if (prefs != null) {
                String tz = prefs.getTimezone() != null ? prefs.getTimezone() : "Asia/Kolkata";
                streakCount = prefs.getCurrentStreakForDate(LocalDate.now(ZoneId.of(tz)));
                gemsCount = prefs.getTotalPoints();
            }
        } catch (Exception e) {
            // Ignore metrics calculation fallback
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
}
