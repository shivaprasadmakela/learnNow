package com.learnnow.trainer.repository;

import com.learnnow.trainer.entity.TrainerNote;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainerNoteRepository extends JpaRepository<TrainerNote, UUID> {

    List<TrainerNote> findByUserIdOrderByCreatedAtDesc(String userId);

    List<TrainerNote> findByUserIdOrderByCreatedAtDesc(String userId, Limit limit);

    long deleteByIdAndUserId(UUID id, String userId);

    long countByUserId(String userId);
}
