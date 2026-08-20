package com.learnnow.user.dto.response;

public record UserDto(
        String id,
        String email,
        String fullName,
        String avatar,
        String role,
        String bio,
        Integer streakCount,
        Integer gemsCount) {}
