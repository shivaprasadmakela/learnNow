package com.learnnow.common.exception;

public class ValidationException extends RuntimeException {
    public ValidationException(String messageKey) {
        super(messageKey);
    }
}
