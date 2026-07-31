package com.learnnow.compiler.api;

import com.learnnow.compiler.api.dto.ShareSnippetRequest;
import com.learnnow.compiler.api.dto.SharedSnippetResponse;
import com.learnnow.compiler.application.CompilerSnippetService;
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
}
