package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * A problem's full editorial: every approach with its intuition and its code in each language.
 *
 * <p>Served on its own endpoint, fetched when the learner opens the editorial, rather than inside
 * the problem payload - a learner who never opens it is never sent the solution.
 */
public record DsaEditorialDto(UUID problemId, List<DsaApproachDto> approaches) {}
