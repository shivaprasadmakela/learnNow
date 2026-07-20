package com.learnnow.learningprogress.exception;

public class InvalidProgressTransitionException extends RuntimeException {
    public InvalidProgressTransitionException(String message) {
        super(message);
    }
}
