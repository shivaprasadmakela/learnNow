package com.learnnow.common.exception;

/**
 * Thrown for authentication and authorisation failures.
 * Mapped to HTTP 401 Unauthorized by {@link GlobalExceptionHandler}.
 */
public class AuthException extends RuntimeException {
    public AuthException(String messageKey) {
        super(messageKey);
    }
}
