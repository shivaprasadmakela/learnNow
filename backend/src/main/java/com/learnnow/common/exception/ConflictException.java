package com.learnnow.common.exception;

public class ConflictException extends RuntimeException {
    public ConflictException(String messageKey) {
        super(messageKey);
    }
}
