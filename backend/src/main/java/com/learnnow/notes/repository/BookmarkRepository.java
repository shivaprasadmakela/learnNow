package com.learnnow.notes.repository;

import com.learnnow.notes.entity.Bookmark;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookmarkRepository extends JpaRepository<Bookmark, UUID> {

    Optional<Bookmark> findByUserIdAndTopicId(String userId, UUID topicId);

    Optional<Bookmark> findByUserIdAndDsaProblemId(String userId, UUID dsaProblemId);

    @Query("SELECT b FROM Bookmark b WHERE b.userId = :userId ORDER BY b.createdAt DESC")
    List<Bookmark> findAllByUserId(@Param("userId") String userId);

    /**
     * Only the bookmarks whose target still exists and is still published.
     *
     * <p>A bookmark on a topic that was later unpublished should not vanish from the database - the
     * learner may well get it back - but it has nothing to link to, so it is filtered on read
     * rather than deleted.
     */
    @Query(
            "SELECT b FROM Bookmark b WHERE b.userId = :userId AND b.topicId IS NOT NULL"
                    + " ORDER BY b.createdAt DESC")
    List<Bookmark> findTopicBookmarksByUserId(@Param("userId") String userId);

    @Query(
            "SELECT b FROM Bookmark b WHERE b.userId = :userId AND b.dsaProblemId IS NOT NULL"
                    + " ORDER BY b.createdAt DESC")
    List<Bookmark> findDsaBookmarksByUserId(@Param("userId") String userId);

    /** Ids only, for the sheet list deciding which rows show a filled bookmark icon. */
    @Query(
            "SELECT b.dsaProblemId FROM Bookmark b WHERE b.userId = :userId"
                    + " AND b.dsaProblemId IN :problemIds")
    List<UUID> findBookmarkedProblemIds(
            @Param("userId") String userId, @Param("problemIds") List<UUID> problemIds);
}
