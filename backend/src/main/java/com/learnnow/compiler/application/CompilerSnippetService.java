package com.learnnow.compiler.application;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.compiler.api.dto.ExecuteCodeRequest;
import com.learnnow.compiler.api.dto.ExecuteCodeResponse;
import com.learnnow.compiler.api.dto.ShareSnippetRequest;
import com.learnnow.compiler.api.dto.SharedSnippetResponse;
import com.learnnow.compiler.persistence.SharedSnippet;
import com.learnnow.compiler.persistence.SharedSnippetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompilerSnippetService {

    private static final String ALPHANUMERIC = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();
    private final SharedSnippetRepository snippetRepository;

    public ExecuteCodeResponse executeCode(ExecuteCodeRequest request) {
        int languageId = mapLanguageToJudge0Id(request.getLanguage());

        Map<String, Object> body = new HashMap<>();
        body.put("language_id", languageId);
        body.put("source_code", request.getCode());
        if (request.getStdin() != null && !request.getStdin().isBlank()) {
            body.put("stdin", request.getStdin());
        }

        try {
            Map<?, ?> response = RestClient.create()
                    .post()
                    .uri("https://ce.judge0.com/submissions?wait=true")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                return ExecuteCodeResponse.builder()
                        .stderr("Execution engine returned empty response")
                        .statusCode(13)
                        .statusDescription("Internal Error")
                        .build();
            }

            String stdout = (String) response.get("stdout");
            String stderr = (String) response.get("stderr");
            String compileOutput = (String) response.get("compile_output");
            String timeStr = (String) response.get("time");
            Number memoryNum = (Number) response.get("memory");

            Double timeSeconds = null;
            if (timeStr != null) {
                try { timeSeconds = Double.parseDouble(timeStr); } catch (Exception ignored) {}
            }

            Long memoryBytes = null;
            if (memoryNum != null) {
                memoryBytes = memoryNum.longValue() * 1024L;
            }

            Integer statusCode = null;
            String statusDesc = null;
            if (response.get("status") instanceof Map<?, ?> statusMap) {
                if (statusMap.get("id") instanceof Number numId) {
                    statusCode = numId.intValue();
                }
                statusDesc = (String) statusMap.get("description");
            }

            return ExecuteCodeResponse.builder()
                    .stdout(stdout)
                    .stderr(stderr)
                    .compileOutput(compileOutput)
                    .statusCode(statusCode)
                    .statusDescription(statusDesc)
                    .timeSeconds(timeSeconds)
                    .memoryBytes(memoryBytes)
                    .build();

        } catch (Exception e) {
            return ExecuteCodeResponse.builder()
                    .stderr("Execution Error: " + e.getMessage())
                    .statusCode(13)
                    .statusDescription("Execution Failed")
                    .build();
        }
    }

    private int mapLanguageToJudge0Id(String language) {
        if (language == null) return 71;
        String lang = language.trim().toLowerCase();
        return switch (lang) {
            case "python", "py", "python3" -> 71;
            case "java" -> 62;
            case "cpp", "c++", "g++" -> 54;
            case "c", "gcc" -> 50;
            case "javascript", "js", "node" -> 63;
            case "typescript", "ts" -> 74;
            case "go", "golang" -> 60;
            case "rust" -> 73;
            case "csharp", "c#", "cs" -> 51;
            case "sql", "sqlite" -> 82;
            case "ruby" -> 72;
            case "php" -> 68;
            default -> 71;
        };
    }

    @Transactional
    public SharedSnippetResponse shareSnippet(ShareSnippetRequest request) {
        String lang = request.getLanguage().trim().toLowerCase();
        String code = request.getCode().trim();
        String hashInput = lang + ":" + code;
        String codeHash = computeSha256(hashInput);

        // Deduplication Check
        Optional<SharedSnippet> existing = snippetRepository.findByCodeHash(codeHash);
        if (existing.isPresent()) {
            SharedSnippet snippet = existing.get();
            snippet.setLastAccessedAt(Instant.now());
            snippetRepository.save(snippet);
            return toResponse(snippet);
        }

        // Create new unique short ID
        String shortId = generateUniqueShortId();
        SharedSnippet newSnippet = SharedSnippet.builder()
                .shortId(shortId)
                .codeHash(codeHash)
                .language(lang)
                .code(code)
                .createdAt(Instant.now())
                .lastAccessedAt(Instant.now())
                .build();

        SharedSnippet saved = snippetRepository.save(newSnippet);
        return toResponse(saved);
    }

    @Transactional
    public SharedSnippetResponse getSnippetByShortId(String shortId) {
        SharedSnippet snippet = snippetRepository.findByShortId(shortId)
                .orElseThrow(() -> new NotFoundException("Code snippet not found for ID: " + shortId));

        snippet.setLastAccessedAt(Instant.now());
        snippetRepository.save(snippet);
        return toResponse(snippet);
    }

    private String generateUniqueShortId() {
        for (int i = 0; i < 10; i++) {
            StringBuilder sb = new StringBuilder(6);
            for (int j = 0; j < 6; j++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            String candidate = sb.toString();
            if (snippetRepository.findByShortId(candidate).isEmpty()) {
                return candidate;
            }
        }
        return "s" + System.currentTimeMillis() % 100000;
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }

    private SharedSnippetResponse toResponse(SharedSnippet snippet) {
        return SharedSnippetResponse.builder()
                .shortId(snippet.getShortId())
                .language(snippet.getLanguage())
                .code(snippet.getCode())
                .createdAt(snippet.getCreatedAt())
                .build();
    }
}
