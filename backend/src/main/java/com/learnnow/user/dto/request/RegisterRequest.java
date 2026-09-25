package com.learnnow.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        // Bounded and pattern-restricted because these values are interpolated into
        // outbound HTML email.
        @NotBlank(message = "first_name_required")
                @Size(max = 60, message = "first_name_too_long")
                @Pattern(
                        regexp = "^[\\p{L}\\p{M}][\\p{L}\\p{M}\\s.'-]*$",
                        message = "first_name_invalid")
                String firstName,
        @NotBlank(message = "last_name_required")
                @Size(max = 60, message = "last_name_too_long")
                @Pattern(
                        regexp = "^[\\p{L}\\p{M}][\\p{L}\\p{M}\\s.'-]*$",
                        message = "last_name_invalid")
                String lastName,
        @NotBlank(message = "email_required")
                @Email(message = "email_invalid")
                @Size(max = 150, message = "email_too_long")
                String email,
        // Raised from 6. The upper bound also stops a very long input from making
        // BCrypt do unbounded work on every login attempt.
        @NotBlank(message = "password_required")
                @Size(min = 12, max = 128, message = "password_too_weak")
                String password) {}
