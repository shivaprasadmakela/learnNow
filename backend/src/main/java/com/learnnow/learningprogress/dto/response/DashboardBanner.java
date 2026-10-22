package com.learnnow.learningprogress.dto.response;

import com.learnnow.paths.dto.response.NextLessonDto;
import java.util.UUID;

/**
 * The dashboard's next-step card: what to do next and why.
 *
 * <p>{@code type} is CONTINUE (an unfinished path you were working on), NEXT (you finished a path;
 * this is the one after it), START (you have not begun anything) or DONE (every path is finished).
 * {@code reason} says why this card, and is null for CONTINUE, whose label already does. {@code
 * nextLesson} is the exact lesson the button opens; null only for DONE.
 */
public record DashboardBanner(
        String type,
        UUID pathId,
        String pathTitle,
        String pathDescription,
        String pathCategory,
        String reason,
        NextLessonDto nextLesson) {}
