package com.bugfix.profile.events;

public record ProfileEvent(
    String userId,
    String eventType,
    long timestamp
) {}
