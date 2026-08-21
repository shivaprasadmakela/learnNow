package com.learnnow.user.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.user.dto.request.*;
import com.learnnow.user.dto.response.*;
import com.learnnow.user.entity.User;
import com.learnnow.user.mapper.UserDtoMapper;
import com.learnnow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserDtoMapper userDtoMapper;

    public UserService(UserRepository userRepository, UserDtoMapper userDtoMapper) {
        this.userRepository = userRepository;
        this.userDtoMapper = userDtoMapper;
    }

    /**
     * Reads the authenticated user's profile. Deliberately read-only: accounts are created only by
     * the registration and Google sign-in flows, so a token whose subject no longer exists is
     * rejected rather than silently resurrecting a deleted account.
     */
    @Transactional(readOnly = true)
    public UserDto getUser(String id) {
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() -> new NotFoundException("user_not_found"));
        return userDtoMapper.toDto(user);
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
        return userDtoMapper.toDto(updated);
    }
}
