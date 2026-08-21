package com.learnnow.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "refresh_token_required") String refreshToken) {}
