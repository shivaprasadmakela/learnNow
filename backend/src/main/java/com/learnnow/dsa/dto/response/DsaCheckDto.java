package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * The inline question, as the learner sees it.
 *
 * <p>There is no field for the correct answer or the explanation. Both are revealed only by the
 * answer endpoint, after a server-side comparison - the same anti-cheat rule the subtopic quiz
 * follows.
 */
public record DsaCheckDto(UUID id, int orderIndex, String prompt, List<String> options) {}
