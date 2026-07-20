package com.learnnow.paths.dto;

public record SubtopicDto(
    Long id,
    String title,
    String content,
    int orderIndex,
    boolean isCompleted
) {}
