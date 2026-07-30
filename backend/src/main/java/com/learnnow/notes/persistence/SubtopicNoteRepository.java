package com.learnnow.notes.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubtopicNoteRepository extends JpaRepository<SubtopicNote, UUID> {
    Optional<SubtopicNote> findByUserIdAndSubtopicId(String userId, UUID subtopicId);
    List<SubtopicNote> findAllByUserId(String userId);
}
