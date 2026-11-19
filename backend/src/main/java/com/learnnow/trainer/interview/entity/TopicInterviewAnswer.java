package com.learnnow.trainer.interview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "topic_interview_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicInterviewAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "interview_id", nullable = false)
    private UUID interviewId;

    @Column(name = "question_id")
    private UUID questionId;

    @Column(name = "subtopic_id")
    private UUID subtopicId;

    /** The question's id in the plan; the only id an AI-written question has. */
    @Column(name = "plan_question_id")
    private UUID planQuestionId;

    /** intro, technical, project, behavioural or hr. */
    @Column(length = 20)
    private String category;

    @Column(name = "model_answer", columnDefinition = "TEXT")
    private String modelAnswer;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String good;

    @Column(columnDefinition = "TEXT")
    private String missing;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
