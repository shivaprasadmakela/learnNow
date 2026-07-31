package com.learnnow.compiler.application;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.compiler.api.dto.ShareSnippetRequest;
import com.learnnow.compiler.api.dto.SharedSnippetResponse;
import com.learnnow.compiler.persistence.SharedSnippet;
import com.learnnow.compiler.persistence.SharedSnippetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompilerSnippetService {

    private static final String ALPHANUMERIC = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();
    private final SharedSnippetRepository snippetRepository;

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
