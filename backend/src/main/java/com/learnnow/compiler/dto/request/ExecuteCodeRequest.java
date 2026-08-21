package com.learnnow.compiler.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 65536, message = "code_too_large")
    private String code;

    // Previously unbounded: only the servlet's request size capped it.
    @Size(max = 8192, message = "stdin_too_large")
    private String stdin;
}
