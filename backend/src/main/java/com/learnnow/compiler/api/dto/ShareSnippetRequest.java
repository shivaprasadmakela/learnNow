package com.learnnow.compiler.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShareSnippetRequest {
    @NotBlank(message = "Language is required")
    private String language;

    @NotBlank(message = "Code is required")
    private String code;
}
