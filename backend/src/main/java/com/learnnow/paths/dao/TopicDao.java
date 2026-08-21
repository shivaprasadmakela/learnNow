package com.learnnow.paths.dao;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Topic;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class TopicDao {

    @PersistenceContext private EntityManager entityManager;

    /**
     * Eagerly fetch a full Topic with all subtopics, content blocks, code snippets, and questions
     * in batch queries to prevent N+1 query overhead when loading study console details.
     */
    public Optional<Topic> findFullTopicDetailsById(UUID id, ContentStatus status) {
        List<Topic> topics =
                entityManager
                        .createQuery(
                                "SELECT DISTINCT t FROM Topic t LEFT JOIN FETCH t.subtopics st"
                                        + " WHERE t.id = :id",
                                Topic.class)
                        .setParameter("id", id)
                        .getResultList();

        if (topics.isEmpty()) {
            return Optional.empty();
        }

        Topic topic = topics.get(0);

        // Fetch pathTopics in a separate query to avoid MultipleBagFetchException
        entityManager
                .createQuery(
                        "SELECT DISTINCT t FROM Topic t LEFT JOIN FETCH t.pathTopics pt WHERE t.id"
                                + " = :id",
                        Topic.class)
                .setParameter("id", id)
                .getResultList();

        List<UUID> subtopicIds =
                topic.getSubtopics() != null
                        ? topic.getSubtopics().stream()
                                .map(com.learnnow.paths.entity.Subtopic::getId)
                                .toList()
                        : List.of();

        if (!subtopicIds.isEmpty()) {
            // Eagerly fetch blocks for subtopics
            entityManager
                    .createQuery(
                            "SELECT DISTINCT st FROM Subtopic st LEFT JOIN FETCH st.blocks WHERE"
                                    + " st.id IN :ids",
                            com.learnnow.paths.entity.Subtopic.class)
                    .setParameter("ids", subtopicIds)
                    .getResultList();

            // Eagerly fetch code snippets for subtopics
            entityManager
                    .createQuery(
                            "SELECT DISTINCT st FROM Subtopic st LEFT JOIN FETCH st.codeSnippets"
                                    + " WHERE st.id IN :ids",
                            com.learnnow.paths.entity.Subtopic.class)
                    .setParameter("ids", subtopicIds)
                    .getResultList();

            List<UUID> blockIds =
                    topic.getSubtopics().stream()
                            .flatMap(
                                    st ->
                                            st.getBlocks() != null
                                                    ? st.getBlocks().stream()
                                                    : java.util.stream.Stream.empty())
                            .map(com.learnnow.admin.entity.ContentBlock::getId)
                            .toList();

            if (!blockIds.isEmpty()) {
                // Eagerly fetch quiz questions for blocks
                entityManager
                        .createQuery(
                                "SELECT DISTINCT b FROM ContentBlock b LEFT JOIN FETCH b.questions"
                                        + " WHERE b.id IN :ids",
                                com.learnnow.admin.entity.ContentBlock.class)
                        .setParameter("ids", blockIds)
                        .getResultList();
            }
        }

        return Optional.of(topic);
    }
}
