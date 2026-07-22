package com.learnnow.common.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String messageKey) {
        super(messageKey);
    }
}
