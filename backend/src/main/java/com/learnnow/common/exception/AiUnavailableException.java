package com.learnnow.common.exception;

/**
 * The AI service could not answer: not configured, unreachable, or its provider failed. Reported as
 * 503 so the UI shows "temporarily unavailable" instead of a broken screen.
 */
public class AiUnavailableException extends RuntimeException {
    public AiUnavailableException(String messageKey) {
        super(messageKey);
    }

    public AiUnavailableException(String messageKey, Throwable cause) {
        super(messageKey, cause);
    }
}
