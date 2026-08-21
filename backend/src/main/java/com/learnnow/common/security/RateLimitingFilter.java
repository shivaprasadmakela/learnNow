package com.learnnow.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * IP-based rate limiting for endpoints that are expensive, abusable, or unauthenticated.
 *
 * <p>Two things this deliberately does not do. It does not read {@code X-Forwarded-For} itself:
 * that header is attacker-controlled unless a trusted proxy has rewritten it, and trusting it
 * blindly let a caller mint a fresh identity per request and bypass limiting entirely. Instead
 * {@code server.forward-headers-strategy=framework} lets Spring's own filter resolve the real
 * client address, and this filter reads {@code getRemoteAddr()}.
 *
 * <p>It also does not grow without bound. Entries are evicted once their window has passed, so a
 * flood of distinct source addresses cannot exhaust the heap.
 *
 * <p>This is per-instance and therefore approximate under horizontal scaling. It is a cheap first
 * line of defence, not a substitute for limiting at the gateway.
 */
@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    /** A tier pairs a set of paths with how many requests per minute they allow. */
    private record Tier(String name, int maxPerMinute, List<String> pathPrefixes) {
        boolean matches(String path) {
            return pathPrefixes.stream().anyMatch(path::startsWith);
        }
    }

    private static final Duration WINDOW = Duration.ofMinutes(1);

    /** Guards against unbounded growth even before eviction runs. */
    private static final int MAX_TRACKED_CLIENTS = 50_000;

    private static final List<Tier> TIERS =
            List.of(
                    // Credential guessing and account-spam surfaces.
                    new Tier("auth", 10, List.of("/api/auth/login", "/api/auth/register")),
                    // Each of these sends a billed email or brute-forces a token, so they are
                    // stricter still. Previously both were entirely unprotected.
                    new Tier(
                            "email",
                            4,
                            List.of("/api/auth/resend-verification", "/api/auth/forgot-password")),
                    new Tier(
                            "token",
                            15,
                            List.of("/api/auth/verify-email", "/api/auth/reset-password")),
                    // Proxies to an external execution engine: metered to keep the service from
                    // becoming a free relay.
                    new Tier("compiler", 20, List.of("/api/compiler/")),
                    // Payment endpoints, excluding the signature-authenticated webhook.
                    new Tier(
                            "payments",
                            20,
                            List.of("/api/donations/create-order", "/api/donations/verify")),
                    // Quiz submission is metered so points cannot be farmed at machine speed.
                    new Tier("quiz", 60, List.of("/api/quizzes/")));

    private final Map<String, RequestTracker> trackers = new ConcurrentHashMap<>();

    private static final class RequestTracker {
        private final Instant windowStart = Instant.now();
        private final AtomicInteger count = new AtomicInteger(1);

        boolean isExpired(Instant now) {
            return Duration.between(windowStart, now).compareTo(WINDOW) > 0;
        }
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Tier tier = resolveTier(request);
        if (tier == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Instant now = Instant.now();
        evictExpired(now);

        String key = tier.name() + '|' + request.getRemoteAddr();
        RequestTracker tracker =
                trackers.compute(
                        key,
                        (k, current) -> {
                            if (current == null || current.isExpired(now)) {
                                return new RequestTracker();
                            }
                            current.count.incrementAndGet();
                            return current;
                        });

        if (tracker.count.get() > tier.maxPerMinute()) {
            log.warn(
                    "Rate limit exceeded on tier '{}' for {}",
                    tier.name(),
                    request.getRemoteAddr());
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setHeader("Retry-After", "60");
            response.getWriter()
                    .write(
                            "{\"code\":\"too_many_requests\",\"message\":\"Too many requests."
                                    + " Please try again in a minute.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Tier resolveTier(HttpServletRequest request) {
        // The Razorpay webhook authenticates by signature and is retried by the gateway;
        // rate limiting it would drop legitimate settlement events.
        String path = request.getRequestURI();
        if (path.startsWith("/api/donations/webhook")) {
            return null;
        }
        if (!"POST".equalsIgnoreCase(request.getMethod())
                && !"PUT".equalsIgnoreCase(request.getMethod())) {
            return null;
        }
        return TIERS.stream().filter(t -> t.matches(path)).findFirst().orElse(null);
    }

    private void evictExpired(Instant now) {
        if (trackers.size() < 256 && trackers.size() < MAX_TRACKED_CLIENTS) {
            return;
        }
        trackers.values().removeIf(t -> t.isExpired(now));
        if (trackers.size() >= MAX_TRACKED_CLIENTS) {
            log.error(
                    "Rate limit tracker at capacity ({} entries) - clearing. Limiting belongs at"
                            + " the gateway under this much load.",
                    trackers.size());
            trackers.clear();
        }
    }
}
