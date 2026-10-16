package com.learnnow.tracks.repository;

import com.learnnow.tracks.entity.TrackStep;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrackStepRepository extends JpaRepository<TrackStep, UUID> {

    /**
     * The steps of several tracks with their paths, in order - only the steps whose path is
     * published, since a draft path is invisible to learners and so cannot be a step they take.
     */
    @Query(
            "SELECT s FROM TrackStep s JOIN FETCH s.path p WHERE s.track.id IN :trackIds AND"
                    + " p.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " ORDER BY s.stepIndex ASC")
    List<TrackStep> findPublishedSteps(@Param("trackIds") Collection<UUID> trackIds);

    /**
     * Removes every step of a track in one statement, flushed before the replacements go in. An
     * import renumbers steps, and position is unique within a track.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TrackStep s WHERE s.track.id = :trackId")
    void deleteByTrackId(@Param("trackId") UUID trackId);
}
