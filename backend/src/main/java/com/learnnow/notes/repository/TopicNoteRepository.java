package com.learnnow.notes.repository;

import com.learnnow.notes.entity.TopicNote;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicNoteRepository extends JpaRepository<TopicNote, UUID> {
    Optional<TopicNote> findByUserIdAndTopicId(String userId, UUID topicId);

    List<TopicNote> findAllByUserId(String userId);
}
