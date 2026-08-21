package com.learnnow.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyEmailRequest(
        @NotBlank(message = "token_required") @Size(max = 128, message = "token_invalid")
                String token) {}
