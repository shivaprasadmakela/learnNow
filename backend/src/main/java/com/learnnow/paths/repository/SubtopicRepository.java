package com.learnnow.paths.repository;

import com.learnnow.paths.entity.Subtopic;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubtopicRepository extends JpaRepository<Subtopic, UUID> {

    @Query("SELECT st FROM Subtopic st JOIN FETCH st.topic WHERE st.id = :id")
    Optional<Subtopic> findByIdWithTopic(@Param("id") UUID id);

    /**
     * A topic's published lessons in teaching order, without their text - the outline a topic shows
     * before any lesson is opened.
     */
    @Query(
            "SELECT st.id AS id, st.title AS title, st.orderIndex AS orderIndex, st.level AS level,"
                    + " st.track AS track, st.estimatedMinutes AS estimatedMinutes FROM Subtopic st"
                    + " WHERE st.topic.id = :topicId AND st.status ="
                    + " com.learnnow.paths.entity.ContentStatus.PUBLISHED ORDER BY st.orderIndex")
    List<LessonRow> findPublishedOutline(@Param("topicId") UUID topicId);

    /**
     * Quiz questions in each of some lessons, as [subtopicId, count]; a lesson with none has no
     * row.
     */
    @Query(
            "SELECT b.subtopic.id, COUNT(q) FROM QuizQuestion q JOIN q.block b WHERE b.subtopic.id"
                    + " IN :ids AND LOWER(b.type) = 'quiz' GROUP BY b.subtopic.id")
    List<Object[]> countQuizQuestions(@Param("ids") Collection<UUID> subtopicIds);

    interface LessonRow {
        UUID getId();

        String getTitle();

        int getOrderIndex();

        String getLevel();

        String getTrack();

        int getEstimatedMinutes();
    }
}
