package com.learnnow.common.exception;

/** The month's AI spending cap is reached, for everyone or for one feature. Reported as 429. */
public class AiLimitException extends RuntimeException {
    public AiLimitException(String messageKey) {
        super(messageKey);
    }
}
