package com.learnnow.learningprogress.dto.response;

import java.time.LocalDate;

public record WeeklyCalendarDay(String name, LocalDate date, boolean completed, boolean isDotted) {}
