package com.learnnow.trainer.interview.repository;

import com.learnnow.trainer.interview.entity.TopicInterviewTurn;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicInterviewTurnRepository extends JpaRepository<TopicInterviewTurn, UUID> {

    List<TopicInterviewTurn> findByInterviewIdOrderBySeqAsc(UUID interviewId);

    List<TopicInterviewTurn> findByInterviewIdIn(Collection<UUID> interviewIds);
}
