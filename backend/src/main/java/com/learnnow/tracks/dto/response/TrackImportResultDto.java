package com.learnnow.tracks.dto.response;

import java.util.UUID;

/** {@code mode} is CREATED for a new slug and UPDATED for one that already existed. */
public record TrackImportResultDto(UUID trackId, String slug, String mode, int steps) {}
