package com.learnnow.user.service;

import com.learnnow.user.dto.UserDto;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto getOrCreateUser(String id, String email) {
        User user = userRepository.findById(id)
                .orElseGet(() -> {
                    // Create default user if none exists
                    User newUser = User.builder()
                            .id(id)
                            .email(email)
                            .fullName(email != null && email.contains("@") ? email.split("@")[0] : "New Learner")
                            .avatar("👨‍💻")
                            .role("Fullstack Developer Apprentice")
                            .bio("Learning React & Spring Boot on Bugfix Academy!")
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
    public UserDto updateUser(String id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found for id: " + id));

        user.setFullName(dto.fullName());
        user.setAvatar(dto.avatar());
        user.setRole(dto.role());
        user.setBio(dto.bio());

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
