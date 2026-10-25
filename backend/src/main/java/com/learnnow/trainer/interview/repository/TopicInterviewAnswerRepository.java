package com.learnnow.trainer.interview.repository;

import com.learnnow.trainer.interview.entity.TopicInterviewAnswer;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicInterviewAnswerRepository extends JpaRepository<TopicInterviewAnswer, UUID> {

    List<TopicInterviewAnswer> findByInterviewId(UUID interviewId);

    List<TopicInterviewAnswer> findByInterviewIdOrderByCreatedAtAsc(UUID interviewId);

    List<TopicInterviewAnswer> findByInterviewIdIn(Collection<UUID> interviewIds);
}
