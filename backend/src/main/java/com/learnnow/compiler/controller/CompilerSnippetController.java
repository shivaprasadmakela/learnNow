package com.learnnow.compiler.controller;

import com.learnnow.compiler.dto.request.ShareSnippetRequest;
import com.learnnow.compiler.dto.response.SharedSnippetResponse;
import com.learnnow.compiler.service.CompilerSnippetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compiler/snippets")
@RequiredArgsConstructor
public class CompilerSnippetController {

    private final CompilerSnippetService snippetService;

    @PostMapping
    public ResponseEntity<SharedSnippetResponse> shareSnippet(@Valid @RequestBody ShareSnippetRequest request) {
        SharedSnippetResponse response = snippetService.shareSnippet(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{shortId}")
    public ResponseEntity<SharedSnippetResponse> getSnippet(@PathVariable String shortId) {
        SharedSnippetResponse response = snippetService.getSnippetByShortId(shortId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/execute")
    public ResponseEntity<com.learnnow.compiler.dto.response.ExecuteCodeResponse> executeCode(@Valid @RequestBody com.learnnow.compiler.dto.request.ExecuteCodeRequest request) {
        return ResponseEntity.ok(snippetService.executeCode(request));
    }
}
