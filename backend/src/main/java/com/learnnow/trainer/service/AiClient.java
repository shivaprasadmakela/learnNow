package com.learnnow.trainer.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.common.exception.AiLimitException;
import com.learnnow.common.exception.AiUnavailableException;
import com.learnnow.common.exception.ValidationException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Calls learnnow-ai, the separate service that holds every AI provider key and the spending cap.
 *
 * <p>The browser never talks to it: requests go learner -> this backend (which knows who they are
 * and what they have studied) -> learnnow-ai with a shared service token. With no base URL
 * configured the trainer is simply off and every call reports {@code ai_unavailable}.
 */
@Component
public class AiClient {

    /** This platform's name in learnnow-ai's ledger and caps; the hiring app will be another. */
    static final String TENANT = "learnnow";

    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String serviceToken;
    private final HttpClient http =
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private volatile Boolean cachedVoiceAvailable = null;
    private volatile long voiceAvailableCacheTime = 0;

    public AiClient(
            ObjectMapper objectMapper,
            @Value("${learnnow.ai.base-url:}") String baseUrl,
            @Value("${learnnow.ai.service-token:}") String serviceToken) {
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.serviceToken = serviceToken;
    }

    public boolean configured() {
        return !baseUrl.isBlank() && !serviceToken.isBlank();
    }

    public boolean voiceAvailable() {
        if (!configured()) {
            return false;
        }
        long now = System.currentTimeMillis();
        if (cachedVoiceAvailable != null && now - voiceAvailableCacheTime < 60_000) {
            return cachedVoiceAvailable;
        }
        try {
            HttpRequest req =
                    HttpRequest.newBuilder(URI.create(baseUrl + "/health"))
                            .timeout(Duration.ofSeconds(3))
                            .GET()
                            .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                Map<String, Object> parsed =
                        objectMapper.readValue(res.body(), new TypeReference<>() {});
                if (parsed.get("providers") instanceof Map<?, ?> prov) {
                    boolean avail = Boolean.TRUE.equals(prov.get("voice"));
                    cachedVoiceAvailable = avail;
                    voiceAvailableCacheTime = now;
                    return avail;
                }
            }
        } catch (Exception e) {
            // fall through
        }
        cachedVoiceAvailable = false;
        voiceAvailableCacheTime = now;
        return false;
    }

    /**
     * Streams the trainer's reply, handing each piece of text to {@code onText} as it arrives.
     * Returns the whole reply once the stream ends.
     */
    public String chat(Map<String, Object> body, Consumer<String> onText) {
        HttpResponse<InputStream> response =
                send(
                        jsonPost("/v1/assistant/chat", body, Duration.ofSeconds(90)),
                        HttpResponse.BodyHandlers.ofInputStream());
        StringBuilder reply = new StringBuilder();
        try (BufferedReader reader =
                new BufferedReader(
                        new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data:")) continue;
                Map<String, Object> event =
                        objectMapper.readValue(line.substring(5).trim(), new TypeReference<>() {});
                if (event.get("text") instanceof String text) {
                    reply.append(text);
                    onText.accept(text);
                } else if (event.containsKey("error")) {
                    throw new AiUnavailableException("ai_unavailable");
                } else if (Boolean.TRUE.equals(event.get("done"))) {
                    break;
                }
            }
        } catch (IOException e) {
            throw new AiUnavailableException("ai_unavailable", e);
        }
        return reply.toString();
    }

    /** Durable notes about the learner drawn from a conversation; at most three. */
    public List<Map<String, String>> notes(Map<String, Object> body) {
        HttpResponse<String> response =
                send(
                        jsonPost("/v1/assistant/notes", body, Duration.ofSeconds(60)),
                        HttpResponse.BodyHandlers.ofString());
        try {
            Map<String, List<Map<String, String>>> parsed =
                    objectMapper.readValue(response.body(), new TypeReference<>() {});
            return parsed.getOrDefault("notes", List.of());
        } catch (IOException e) {
            throw new AiUnavailableException("ai_unavailable", e);
        }
    }

    /** Text from one short WAV clip (up to 30 seconds). */
    public String transcribe(byte[] wav, String feature) {
        String boundary = "learnnow-" + UUID.randomUUID();
        byte[] body = multipart(boundary, feature, wav);
        HttpRequest request =
                authorised("/v1/speech/transcribe", Duration.ofSeconds(40))
                        .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                        .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                        .build();
        HttpResponse<String> response = send(request, HttpResponse.BodyHandlers.ofString());
        try {
            Map<String, String> parsed =
                    objectMapper.readValue(response.body(), new TypeReference<>() {});
            return parsed.getOrDefault("text", "");
        } catch (IOException e) {
            throw new AiUnavailableException("ai_unavailable", e);
        }
    }

    public Map<String, Object> startInterview(Map<String, Object> body) {
        HttpResponse<String> response =
                send(
                        jsonPost("/v1/interviews/start", body, Duration.ofSeconds(30)),
                        HttpResponse.BodyHandlers.ofString());
        try {
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (IOException e) {
            throw new AiUnavailableException("ai_unavailable", e);
        }
    }

    public Map<String, Object> scoreInterview(Map<String, Object> body) {
        HttpResponse<String> response =
                send(
                        jsonPost("/v1/interviews/score", body, Duration.ofSeconds(90)),
                        HttpResponse.BodyHandlers.ofString());
        try {
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (IOException e) {
            throw new AiUnavailableException("ai_unavailable", e);
        }
    }

    private HttpRequest.Builder authorised(String path, Duration timeout) {
        if (!configured()) {
            throw new AiUnavailableException("ai_unavailable");
        }
        return HttpRequest.newBuilder(URI.create(baseUrl + path))
                .timeout(timeout)
                .header("Authorization", "Bearer " + serviceToken);
    }

    private HttpRequest jsonPost(String path, Map<String, Object> body, Duration timeout) {
        Map<String, Object> withTenant = new java.util.LinkedHashMap<>(body);
        withTenant.put("tenant", TENANT);
        try {
            return authorised(path, timeout)
                    .header("Content-Type", "application/json")
                    .POST(
                            HttpRequest.BodyPublishers.ofString(
                                    objectMapper.writeValueAsString(withTenant)))
                    .build();
        } catch (IOException e) {
            throw new AiUnavailableException("ai_unavailable", e);
        }
    }

    /** Sends, and turns learnnow-ai's refusals into this application's exceptions. */
    private <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> handler) {
        HttpResponse<T> response;
        try {
            response = http.send(request, handler);
        } catch (IOException e) {
            throw new AiUnavailableException("ai_unavailable", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AiUnavailableException("ai_unavailable", e);
        }
        int status = response.statusCode();
        if (status == 429) throw new AiLimitException("ai_limit_reached");
        if (status == 422 && request.uri().getPath().endsWith("/transcribe")) {
            throw new ValidationException("ai_clip_rejected");
        }
        if (status >= 400) {
            throw new AiUnavailableException(
                    "ai_unavailable", new IOException("learnnow-ai answered " + status));
        }
        return response;
    }

    private static byte[] multipart(String boundary, String feature, byte[] wav) {
        String head =
                "--"
                        + boundary
                        + "\r\nContent-Disposition: form-data; name=\"tenant\"\r\n\r\n"
                        + TENANT
                        + "\r\n"
                        + "--"
                        + boundary
                        + "\r\nContent-Disposition: form-data; name=\"feature\"\r\n\r\n"
                        + feature
                        + "\r\n"
                        + "--"
                        + boundary
                        + "\r\n"
                        + "Content-Disposition: form-data; name=\"file\"; filename=\"clip.wav\"\r\n"
                        + "Content-Type: audio/wav\r\n\r\n";
        String tail = "\r\n--" + boundary + "--\r\n";
        byte[] h = head.getBytes(StandardCharsets.UTF_8);
        byte[] t = tail.getBytes(StandardCharsets.UTF_8);
        byte[] out = new byte[h.length + wav.length + t.length];
        System.arraycopy(h, 0, out, 0, h.length);
        System.arraycopy(wav, 0, out, h.length, wav.length);
        System.arraycopy(t, 0, out, h.length + wav.length, t.length);
        return out;
    }
}
