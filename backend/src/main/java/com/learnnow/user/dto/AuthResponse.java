package com.learnnow.user.dto;

public record AuthResponse(
    String token,
    UserDto profile
) {}
