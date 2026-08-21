package com.learnnow.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResendVerificationRequest(
        @NotBlank(message = "email_required")
                @Email(message = "email_invalid")
                @Size(max = 150, message = "email_too_long")
                String email) {}
