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

    List<InterviewQuestion> findByParentIdAndStatusOrderByOrderIndex(
            UUID parentId, ContentStatus status);

    /**
     * How many opening questions and follow-ups each subtopic has - counts, never the questions.
     */
    @Query(
            "SELECT q.subtopicId AS subtopicId,"
                    + " SUM(CASE WHEN q.parentId IS NULL THEN 1 ELSE 0 END) AS openers,"
                    + " SUM(CASE WHEN q.parentId IS NULL THEN 0 ELSE 1 END) AS followUps"
                    + " FROM InterviewQuestion q"
                    + " WHERE q.subtopicId IN :ids AND q.status = :status"
                    + " GROUP BY q.subtopicId")
    List<CountRow> countBySubtopic(
            @Param("ids") Collection<UUID> subtopicIds, @Param("status") ContentStatus status);

    /**
     * Opening questions on the published lessons of each of some paths' published topics, as
     * [pathId, count] - what a path's Interview tab is labelled with before anything is fetched.
     */
    @Query(
            "SELECT pt.path.id, COUNT(q) FROM InterviewQuestion q, Subtopic st, PathTopic pt WHERE"
                    + " q.subtopicId = st.id AND st.topic = pt.topic AND pt.path.id IN :pathIds AND"
                    + " q.parentId IS NULL AND q.status ="
                    + " com.learnnow.paths.entity.ContentStatus.PUBLISHED AND st.status ="
                    + " com.learnnow.paths.entity.ContentStatus.PUBLISHED AND pt.topic.status ="
                    + " com.learnnow.paths.entity.ContentStatus.PUBLISHED GROUP BY pt.path.id")
    List<Object[]> countOpenersByPathIds(@Param("pathIds") Collection<UUID> pathIds);

    /** Opening questions on some lessons, in total - a topic's Interview tab label. */
    @Query(
            "SELECT COUNT(q) FROM InterviewQuestion q WHERE q.subtopicId IN :ids AND q.parentId IS"
                    + " NULL AND q.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED")
    long countOpeners(@Param("ids") Collection<UUID> subtopicIds);

    /** Whether a subtopic and its topic are both published - what a learner may read. */
    @Query(
            "SELECT COUNT(st) > 0 FROM Subtopic st JOIN st.topic t WHERE st.id = :id"
                    + " AND t.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " AND st.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED")
    boolean isPublishedSubtopic(@Param("id") UUID subtopicId);

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

    /** The published lessons of a path's published topics, in the order the path teaches them. */
    @Query(
            "SELECT st.id AS id, st.title AS title, t.id AS topicId, t.title AS topicTitle"
                    + " FROM Subtopic st JOIN st.topic t, PathTopic pt"
                    + " WHERE pt.topic = t AND pt.path.id = :pathId"
                    + " AND t.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " AND st.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " ORDER BY pt.orderIndex, st.orderIndex")
    List<SubtopicRow> findPublishedSubtopicsInPath(@Param("pathId") UUID pathId);

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

    interface CountRow {
        UUID getSubtopicId();

        Long getOpeners();

        Long getFollowUps();
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
