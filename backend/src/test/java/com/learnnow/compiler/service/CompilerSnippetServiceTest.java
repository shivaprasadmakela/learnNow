package com.learnnow.compiler.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.learnnow.compiler.dto.request.ShareSnippetRequest;
import com.learnnow.compiler.dto.response.SharedSnippetResponse;
import com.learnnow.compiler.entity.SharedSnippet;
import com.learnnow.compiler.repository.SharedSnippetRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CompilerSnippetServiceTest {

    @Mock private SharedSnippetRepository snippetRepository;

    @InjectMocks private CompilerSnippetService snippetService;

    @Test
    void shareSnippet_NewSnippet_SavesAndReturnsShortId() {
        ShareSnippetRequest request = new ShareSnippetRequest();
        request.setLanguage("javascript");
        request.setCode("console.log('test');");

        when(snippetRepository.findByCodeHash(anyString())).thenReturn(Optional.empty());
        when(snippetRepository.findByShortId(anyString())).thenReturn(Optional.empty());
        when(snippetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SharedSnippetResponse response = snippetService.shareSnippet(request);

        assertNotNull(response);
        assertNotNull(response.getShortId());
        assertEquals("javascript", response.getLanguage());
        assertEquals("console.log('test');", response.getCode());

        verify(snippetRepository, times(1)).save(any());
    }

    @Test
    void shareSnippet_ExistingSnippet_ReturnsExistingShortId_WithoutDuplicateSave() {
        ShareSnippetRequest request = new ShareSnippetRequest();
        request.setLanguage("javascript");
        request.setCode("console.log('test');");

        SharedSnippet existing =
                SharedSnippet.builder()
                        .shortId("a8K9z2")
                        .codeHash("hash123")
                        .language("javascript")
                        .code("console.log('test');")
                        .createdAt(Instant.now())
                        .build();

        when(snippetRepository.findByCodeHash(anyString())).thenReturn(Optional.of(existing));
        when(snippetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SharedSnippetResponse response = snippetService.shareSnippet(request);

        assertEquals("a8K9z2", response.getShortId());
        assertEquals("javascript", response.getLanguage());
    }
}
