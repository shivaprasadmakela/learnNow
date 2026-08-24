package com.learnnow.dsa.dto.response;

import java.util.UUID;

/**
 * One rung of a problem's section ancestry.
 *
 * <p>Sent as a list from root to leaf, so the client can rebuild the tree from a flat page of
 * problems. That is what keeps pagination and arbitrary nesting compatible: there is no separate
 * tree endpoint to keep in sync, and a section split across two pages rejoins itself by id.
 */
public record DsaSectionRefDto(UUID id, String title, int depth) {}
