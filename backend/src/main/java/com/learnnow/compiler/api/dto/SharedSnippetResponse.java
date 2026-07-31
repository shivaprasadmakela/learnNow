package com.learnnow.compiler.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedSnippetResponse {
    private String shortId;
    private String language;
    private String code;
    private Instant createdAt;
}
