package com.learnnow.profile.service;

import com.learnnow.profile.dto.UserDto;
import com.learnnow.profile.entity.User;
import com.learnnow.profile.repository.UserRepository;
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
                    User newUser = new User(
                            id,
                            email,
                            email != null && email.contains("@") ? email.split("@")[0] : "New Learner",
                            "👨‍💻",
                            "Fullstack Developer Apprentice",
                            "Learning React & Spring Boot on Bugfix Academy!"
                    );
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
