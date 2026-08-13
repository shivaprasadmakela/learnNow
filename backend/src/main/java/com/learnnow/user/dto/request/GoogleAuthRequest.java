package com.learnnow.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "id_token_required")
        String idToken
) {}
