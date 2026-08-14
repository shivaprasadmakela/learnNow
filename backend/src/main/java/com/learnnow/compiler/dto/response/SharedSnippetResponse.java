package com.learnnow.compiler.dto.response;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
