package com.learnnow.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Lightweight IP-based rate limiting filter for sensitive endpoints (/api/auth/login, /api/auth/register).
 * Protects against brute-force password guessing and registration spam.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private final Map<String, RequestTracker> ipTrackers = new ConcurrentHashMap<>();

    private static class RequestTracker {
        final long startTimeMs = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(1);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Rate limit sensitive POST requests to authentication endpoints
        if ("POST".equalsIgnoreCase(method) && (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register"))) {
            String clientIp = getClientIp(request);
            long now = System.currentTimeMillis();

            RequestTracker tracker = ipTrackers.compute(clientIp, (ip, current) -> {
                if (current == null || (now - current.startTimeMs) > 60_000) {
                    return new RequestTracker();
                }
                current.count.incrementAndGet();
                return current;
            });

            if (tracker.count.get() > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"code\":\"too_many_requests\",\"message\":\"Too many authentication attempts. Please try again in 1 minute.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
