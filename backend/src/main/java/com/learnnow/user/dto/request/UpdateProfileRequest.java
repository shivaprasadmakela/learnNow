package com.learnnow.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank(message = "full_name_required") String fullName, String avatar, String bio) {}
