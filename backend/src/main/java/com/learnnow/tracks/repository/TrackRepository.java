package com.learnnow.tracks.repository;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.tracks.entity.Track;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackRepository extends JpaRepository<Track, UUID> {

    Optional<Track> findBySlug(String slug);

    Optional<Track> findBySlugAndStatus(String slug, ContentStatus status);

    List<Track> findByStatusOrderByOrderIndexAscTitleAsc(ContentStatus status);
}
