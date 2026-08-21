package com.learnnow.compiler.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.compiler.dto.request.ExecuteCodeRequest;
import com.learnnow.compiler.dto.request.ShareSnippetRequest;
import com.learnnow.compiler.dto.response.ExecuteCodeResponse;
import com.learnnow.compiler.dto.response.SharedSnippetResponse;
import com.learnnow.compiler.entity.SharedSnippet;
import com.learnnow.compiler.repository.SharedSnippetRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
public class CompilerSnippetService {

    public CompilerSnippetService(
            SharedSnippetRepository snippetRepository,
            @Qualifier("codeExecutionRestClient") RestClient codeExecutionRestClient) {
        this.snippetRepository = snippetRepository;
        this.codeExecutionRestClient = codeExecutionRestClient;
    }

    private static final String ALPHANUMERIC =
            "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String EMPTY_RESPONSE_MSG = "Execution engine returned empty response";
    private static final String INTERNAL_ERROR_MSG = "Internal Error";
    private static final String EXECUTION_ERROR_PREFIX = "Execution Error: ";
    private static final String EXECUTION_FAILED_MSG = "Execution Failed";

    private static final String KEY_STDOUT = "stdout";
    private static final String KEY_STDERR = "stderr";
    private static final String KEY_COMPILE_OUTPUT = "compile_output";
    private static final String KEY_TIME = "time";
    private static final String KEY_MEMORY = "memory";
    private static final String KEY_STATUS = "status";
    private static final String KEY_STATUS_ID = "id";
    private static final String KEY_STATUS_DESCRIPTION = "description";

    private static final String KEY_LANGUAGE_ID = "language_id";
    private static final String KEY_SOURCE_CODE = "source_code";
    private static final String KEY_STDIN = "stdin";

    private final SharedSnippetRepository snippetRepository;

    /** Timeout-configured client; see {@code HttpClientConfig}. */
    private final RestClient codeExecutionRestClient;

    public ExecuteCodeResponse executeCode(ExecuteCodeRequest request) {
        int languageId = mapLanguageToJudge0Id(request.getLanguage());
        String code = request.getCode();
        if ("java".equalsIgnoreCase(request.getLanguage())) {
            code = prepareJavaSourceCode(code);
        }

        Map<String, Object> body = new HashMap<>();
        body.put(KEY_LANGUAGE_ID, languageId);
        body.put(KEY_SOURCE_CODE, code);
        if (request.getStdin() != null && !request.getStdin().isBlank()) {
            body.put(KEY_STDIN, request.getStdin());
        }

        try {
            Map<?, ?> response =
                    codeExecutionRestClient
                            .post()
                            .uri("/submissions?wait=true")
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(body)
                            .retrieve()
                            .body(Map.class);

            if (response == null) {
                return ExecuteCodeResponse.builder()
                        .stderr(EMPTY_RESPONSE_MSG)
                        .statusCode(13)
                        .statusDescription(INTERNAL_ERROR_MSG)
                        .build();
            }

            String stdout = (String) response.get(KEY_STDOUT);
            String stderr = (String) response.get(KEY_STDERR);
            String compileOutput = (String) response.get(KEY_COMPILE_OUTPUT);
            String timeStr = (String) response.get(KEY_TIME);
            Number memoryNum = (Number) response.get(KEY_MEMORY);

            Double timeSeconds = null;
            if (timeStr != null) {
                try {
                    timeSeconds = Double.parseDouble(timeStr);
                } catch (Exception ignored) {
                }
            }

            Long memoryBytes = null;
            if (memoryNum != null) {
                memoryBytes = memoryNum.longValue() * 1024L;
            }

            Integer statusCode = null;
            String statusDesc = null;
            if (response.get(KEY_STATUS) instanceof Map<?, ?> statusMap) {
                if (statusMap.get(KEY_STATUS_ID) instanceof Number numId) {
                    statusCode = numId.intValue();
                }
                statusDesc = (String) statusMap.get(KEY_STATUS_DESCRIPTION);
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
            log.warn("Code execution failed for language {}", request.getLanguage(), e);
            return ExecuteCodeResponse.builder()
                    .stderr(EXECUTION_ERROR_PREFIX + e.getMessage())
                    .statusCode(13)
                    .statusDescription(EXECUTION_FAILED_MSG)
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
        SharedSnippet newSnippet =
                SharedSnippet.builder()
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

    /**
     * Reads are read-only. This previously wrote {@code lastAccessedAt} on every request, which
     * made a public GET non-idempotent and turned link traffic into write load.
     */
    @Transactional(readOnly = true)
    public SharedSnippetResponse getSnippetByShortId(String shortId) {
        return snippetRepository
                .findByShortId(shortId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("snippet_not_found"));
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

    private String prepareJavaSourceCode(String code) {
        if (code == null || code.isBlank()) return code;
        String trimmed = code.trim();
        boolean hasClassOrInterface =
                trimmed.contains("class ")
                        || trimmed.contains("interface ")
                        || trimmed.contains("enum ")
                        || trimmed.contains("record ");
        boolean hasMain = trimmed.contains("main(");

        if (!hasClassOrInterface && !hasMain) {
            String indented = "        " + trimmed.replace("\n", "\n        ");
            return "public class Main {\n    public static void main(String[] args) {\n"
                    + indented
                    + "\n    }\n}";
        }

        if (trimmed.contains("public class ") && !trimmed.contains("public class Main")) {
            return trimmed.replaceAll("public\\s+class\\s+[A-Za-z0-9_]+", "public class Main");
        }

        return trimmed;
    }
}
