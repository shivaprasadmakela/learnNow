package com.bugfix.profile.mapper;

import com.bugfix.profile.dto.UserDto;
import com.bugfix.profile.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserDto toDto(User user) {
        if (user == null) return null;
        return new UserDto(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getAvatar(),
            user.getRole(),
            user.getBio()
        );
    }

    public User toEntity(UserDto dto) {
        if (dto == null) return null;
        return new User(
            dto.id(),
            dto.email(),
            dto.fullName(),
            dto.avatar(),
            dto.role(),
            dto.bio()
        );
    }
}
