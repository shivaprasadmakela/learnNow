package com.learnnow.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "email_required")
                @Email(message = "email_invalid")
                @Size(max = 150, message = "email_too_long")
                String email,
        @NotBlank(message = "password_required") @Size(max = 128, message = "password_too_long")
                String password) {}
