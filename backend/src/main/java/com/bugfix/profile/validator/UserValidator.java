package com.bugfix.profile.validator;

import com.bugfix.profile.dto.UserDto;
import org.springframework.stereotype.Component;

@Component
public class UserValidator {
    public void validate(UserDto dto) {
        if (dto == null) {
            throw new IllegalArgumentException("User details cannot be null");
        }
        if (dto.email() == null || dto.email().isBlank()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
    }
}
