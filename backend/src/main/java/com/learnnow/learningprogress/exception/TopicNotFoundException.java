package com.learnnow.learningprogress.exception;

public class TopicNotFoundException extends RuntimeException {
    public TopicNotFoundException() {
        super("topic_not_found");
    }
}
