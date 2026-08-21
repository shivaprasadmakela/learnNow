package com.learnnow.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "full_name_required") @Size(max = 100, message = "full_name_too_long")
                String fullName,
        @Size(max = 512, message = "avatar_too_long") String avatar,
        @Size(max = 500, message = "bio_too_long") String bio) {}
