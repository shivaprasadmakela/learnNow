package com.learnnow.compiler.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecuteCodeRequest {
    @NotBlank(message = "language_required")
    private String language;

    @NotBlank(message = "code_required")
    private String code;

    private String stdin;
}
