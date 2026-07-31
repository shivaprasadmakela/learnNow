package com.learnnow.user.service;

import com.learnnow.user.dto.*;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto getOrCreateUser(String id, String email) {
        User user = userRepository.findById(id)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .id(id)
                            .email(email)
                            .fullName(email != null && email.contains("@") ? email.split("@")[0] : "New Learner")
                            .avatar(UUID.randomUUID().toString())
                            .passwordHash("")
                            .build();
                    return userRepository.save(newUser);
                });

        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatar(),
                user.getRole(),
                user.getBio()
        );
    }

    @Transactional
    public UserDto updateUser(String id, UpdateProfileRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found for id: " + id));

        if (req.fullName() != null && !req.fullName().isBlank()) {
            user.setFullName(req.fullName());
        }
        if (req.avatar() != null) user.setAvatar(req.avatar());
        if (req.bio() != null) user.setBio(req.bio());

        User updated = userRepository.save(user);
        return new UserDto(
                updated.getId(),
                updated.getEmail(),
                updated.getFullName(),
                updated.getAvatar(),
                updated.getRole(),
                updated.getBio()
        );
    }
}
