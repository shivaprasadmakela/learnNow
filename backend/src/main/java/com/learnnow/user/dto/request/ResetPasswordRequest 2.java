package com.learnnow.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "token_required") String token,
        @NotBlank(message = "password_required")
                @Size(min = 12, max = 128, message = "password_too_weak")
                String password) {}
