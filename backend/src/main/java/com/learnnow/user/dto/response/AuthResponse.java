package com.learnnow.user.dto.response;

public record AuthResponse(String token, UserDto profile) {}
