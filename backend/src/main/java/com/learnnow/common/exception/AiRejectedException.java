package com.learnnow.common.exception;

/**
 * The AI service refused a request for a reason the learner can act on, e.g. "No text could be read
 * from this file". Unlike {@link ValidationException}, which carries a message key, this carries
 * the learner-safe text itself, because it was written by learnnow-ai. Reported as 422 with {@code
 * code} and that text.
 */
public class AiRejectedException extends RuntimeException {

    private final String code;

    public AiRejectedException(String code, String learnerMessage) {
        super(learnerMessage);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
