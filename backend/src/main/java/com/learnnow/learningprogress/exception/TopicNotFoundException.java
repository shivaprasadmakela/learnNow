package com.learnnow.learningprogress.exception;

import com.learnnow.common.exception.NotFoundException;

public class TopicNotFoundException extends NotFoundException {
    public TopicNotFoundException() {
        super("topic_not_found");
    }
}
