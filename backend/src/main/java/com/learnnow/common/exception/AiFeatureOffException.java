package com.learnnow.common.exception;

/**
 * An admin has switched this AI feature off. Reported as 503 {@code ai_feature_off}, like any other
 * unavailability, so the UI shows the same "not available right now" state.
 */
public class AiFeatureOffException extends AiUnavailableException {
    public AiFeatureOffException() {
        super("ai_feature_off");
    }
}
