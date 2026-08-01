package com.learnnow.compiler.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecuteCodeResponse {
    private String stdout;
    private String stderr;
    private String compileOutput;
    private Integer statusCode;
    private String statusDescription;
    private Double timeSeconds;
    private Long memoryBytes;
}
