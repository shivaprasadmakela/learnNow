package com.learnnow.notes.repository;

import com.learnnow.notes.entity.Note;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    Optional<Note> findByUserIdAndSubtopicId(String userId, UUID subtopicId);

    Optional<Note> findByUserIdAndTopicId(String userId, UUID topicId);

    Optional<Note> findByUserIdAndDsaProblemId(String userId, UUID dsaProblemId);

    /** Every note the learner has, newest first, whatever it is attached to. */
    @Query("SELECT n FROM Note n WHERE n.userId = :userId ORDER BY n.updatedAt DESC")
    List<Note> findAllByUserId(@Param("userId") String userId);

    @Query(
            "SELECT n FROM Note n WHERE n.userId = :userId AND n.subtopicId IS NOT NULL"
                    + " ORDER BY n.updatedAt DESC")
    List<Note> findSubtopicNotesByUserId(@Param("userId") String userId);

    @Query(
            "SELECT n FROM Note n WHERE n.userId = :userId AND n.topicId IS NOT NULL"
                    + " ORDER BY n.updatedAt DESC")
    List<Note> findTopicNotesByUserId(@Param("userId") String userId);

    @Query(
            "SELECT n FROM Note n WHERE n.userId = :userId AND n.dsaProblemId IS NOT NULL"
                    + " ORDER BY n.updatedAt DESC")
    List<Note> findDsaNotesByUserId(@Param("userId") String userId);
}
