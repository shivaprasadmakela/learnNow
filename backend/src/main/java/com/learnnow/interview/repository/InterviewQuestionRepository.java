package com.learnnow.interview.repository;

import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.paths.entity.ContentStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, UUID> {

    List<InterviewQuestion> findByQuestionKeyIn(Collection<String> keys);

    List<InterviewQuestion> findBySubtopicIdInAndStatus(
            Collection<UUID> subtopicIds, ContentStatus status);

    /**
     * Where each question was reported as asked. Deliberately leaves out source_url: the projection
     * has no getter for it, so no caller of this method can leak it.
     */
    @Query(
            value =
                    "SELECT qr.question_id AS questionId, r.company AS company, r.role AS role,"
                            + " r.level AS level, r.round AS round, r.seen_month AS seenMonth"
                            + " FROM interview_question_reports qr"
                            + " JOIN interview_reports r ON r.id = qr.report_id"
                            + " WHERE qr.question_id IN (:ids)"
                            + " ORDER BY r.seen_month DESC NULLS LAST, r.company",
            nativeQuery = true)
    List<SightingRow> findSightings(@Param("ids") Collection<UUID> questionIds);

    /** Every subtopic of a path with the topic it sits in, in the order the path teaches them. */
    @Query(
            "SELECT st.id AS id, st.title AS title, t.id AS topicId, t.title AS topicTitle"
                    + " FROM Subtopic st JOIN st.topic t, PathTopic pt"
                    + " WHERE pt.topic = t AND pt.path.id = :pathId"
                    + " ORDER BY pt.orderIndex, st.orderIndex")
    List<SubtopicRow> findSubtopicsInPath(@Param("pathId") UUID pathId);

    /** A published topic's published lessons with the topic they sit in, in teaching order. */
    @Query(
            "SELECT st.id AS id, st.title AS title, t.id AS topicId, t.title AS topicTitle"
                    + " FROM Subtopic st JOIN st.topic t WHERE t.id = :topicId"
                    + " AND t.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " AND st.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " ORDER BY st.orderIndex")
    List<SubtopicRow> findPublishedSubtopicsInTopic(@Param("topicId") UUID topicId);

    interface SubtopicRow {
        UUID getId();

        String getTitle();

        UUID getTopicId();

        String getTopicTitle();
    }

    interface SightingRow {
        UUID getQuestionId();

        String getCompany();

        String getRole();

        String getLevel();

        String getRound();

        LocalDate getSeenMonth();
    }
}
