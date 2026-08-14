package com.learnnow.notes.repository;

import com.learnnow.notes.entity.SubtopicNote;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubtopicNoteRepository extends JpaRepository<SubtopicNote, UUID> {
    Optional<SubtopicNote> findByUserIdAndSubtopicId(String userId, UUID subtopicId);

    List<SubtopicNote> findAllByUserId(String userId);
}
