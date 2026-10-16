package com.learnnow.tracks.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * A track as written in learnNow-content's tracks/*.json. Importing upserts by {@code slug}: the
 * track's details are updated and its steps replaced wholesale, in the order given.
 *
 * <p>Steps name their path by title, the way an author knows it, rather than by an id that differs
 * between local, dev and prod.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ImportTrackRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String slug,
        @NotBlank @Size(max = 255) String title,
        @Size(max = 1000) String description,
        Integer orderIndex,
        @NotEmpty @Valid List<Step> steps) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Step(@NotBlank String path, boolean optional, @Size(max = 500) String note) {}
}
