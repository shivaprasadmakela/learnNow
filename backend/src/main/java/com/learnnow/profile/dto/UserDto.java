package com.learnnow.profile.dto;

public record UserDto(
    String id,
    String email,
    String fullName,
    String avatar,
    String role,
    String bio
) {}
