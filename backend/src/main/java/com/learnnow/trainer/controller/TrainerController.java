package com.learnnow.trainer.controller;

import com.learnnow.common.exception.AiLimitException;
import com.learnnow.common.exception.AiUnavailableException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.trainer.dto.ChatRequest;
import com.learnnow.trainer.dto.GoalRequest;
import com.learnnow.trainer.dto.GoalResponse;
import com.learnnow.trainer.dto.TrainerProfileResponse;
import com.learnnow.trainer.service.TrainerService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * The learner's personal trainer: Ask AI, their goal, and what the trainer has noted about them.
 *
 * <p>Replies stream as server-sent events: {@code {"text": ...}} pieces, then {@code {"done":
 * true}}, or {@code {"error": code, "message": ...}} if the trainer could not answer. Errors arrive
 * as an event rather than a status because the stream has already started by the time they can
 * happen.
 */
@Slf4j
@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
public class TrainerController {

    /** Longer than any reply takes; the AI client times out first. */
    private static final long STREAM_TIMEOUT_MS = 120_000;

    private static final long MAX_CLIP_BYTES = 2_000_000;

    private final TrainerService trainerService;
    private final MessageSource messageSource;
    private final ExecutorService streams = Executors.newVirtualThreadPerTaskExecutor();

    @GetMapping
    public ResponseEntity<TrainerProfileResponse> profile(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(trainerService.profile(jwt.getSubject()));
    }

    @PutMapping("/goal")
    public ResponseEntity<GoalResponse> saveGoal(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(trainerService.saveGoal(jwt.getSubject(), request));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID noteId) {
        trainerService.deleteNote(jwt.getSubject(), noteId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/notes")
    public ResponseEntity<Void> deleteAllNotes(@AuthenticationPrincipal Jwt jwt) {
        trainerService.deleteAllNotes(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChatRequest request) {
        String userId = jwt.getSubject();
        if (!"user".equals(request.messages().get(request.messages().size() - 1).role())) {
            throw new ValidationException("trainer_last_message_not_learner");
        }
        // Loaded here, on the request thread, inside the service's read transaction.
        Map<String, Object> context = trainerService.chatContext(userId, request);
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        streams.execute(
                () -> {
                    try {
                        trainerService.streamReply(
                                userId,
                                request,
                                context,
                                text -> send(emitter, Map.of("text", text)));
                        send(emitter, Map.of("done", true));
                        emitter.complete();
                    } catch (AiLimitException | AiUnavailableException e) {
                        log.warn("Ask AI failed: {}", e.getMessage(), e.getCause());
                        sendError(emitter, e.getMessage());
                    } catch (ClientGone e) {
                        emitter.complete();
                    } catch (RuntimeException e) {
                        log.error("Ask AI failed unexpectedly", e);
                        sendError(emitter, "ai_unavailable");
                    }
                });
        return emitter;
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> transcribe(
            @AuthenticationPrincipal Jwt jwt, @RequestParam("file") MultipartFile file)
            throws IOException {
        if (file.isEmpty() || file.getSize() > MAX_CLIP_BYTES) {
            throw new ValidationException("ai_clip_rejected");
        }
        return ResponseEntity.ok(Map.of("text", trainerService.transcribe(file.getBytes())));
    }

    /** The learner closed the panel mid-reply; stop quietly. */
    private static final class ClientGone extends RuntimeException {
        ClientGone(Throwable cause) {
            super(cause);
        }
    }

    private static void send(SseEmitter emitter, Map<String, Object> event) {
        try {
            emitter.send(SseEmitter.event().data(event, MediaType.APPLICATION_JSON));
        } catch (IOException | IllegalStateException e) {
            throw new ClientGone(e);
        }
    }

    private void sendError(SseEmitter emitter, String code) {
        try {
            String message =
                    messageSource.getMessage(code, null, code, LocaleContextHolder.getLocale());
            emitter.send(
                    SseEmitter.event()
                            .data(
                                    Map.of("error", code, "message", message),
                                    MediaType.APPLICATION_JSON));
            emitter.complete();
        } catch (IOException | IllegalStateException e) {
            emitter.complete();
        }
    }
}
