package com.learnnow.user.dto;

public record LoginRequest(
    String email,
    String password
) {}
