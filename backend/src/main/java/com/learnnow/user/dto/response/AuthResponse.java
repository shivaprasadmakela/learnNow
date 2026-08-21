package com.learnnow.user.dto.response;

/**
 * @param token short-lived access token, sent as a bearer credential
 * @param refreshToken opaque, revocable renewal token; exchanged at /api/auth/refresh
 * @param expiresInSeconds lifetime of {@code token}, so the client can renew before it lapses
 */
public record AuthResponse(
        String token, String refreshToken, long expiresInSeconds, UserDto profile) {}
