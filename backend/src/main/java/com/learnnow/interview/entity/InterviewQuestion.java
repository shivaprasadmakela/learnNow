package com.learnnow.interview.entity;

import com.learnnow.paths.entity.ContentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A question asked in a real interview, anchored to the subtopic that teaches its answer.
 *
 * <p>The subtopic and parent are plain ids rather than mapped associations. An import builds a
 * whole tree of follow-ups at once, and what it needs is each parent's id before its children are
 * written - not a graph Hibernate would load, cascade and reorder.
 */
@Entity
@Table(name = "interview_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Mapped as "key"; named otherwise in Java because KEY is a JPQL keyword. */
    @Column(name = "key", nullable = false, length = 160)
    private String questionKey;

    @Column(name = "subtopic_id", nullable = false)
    private UUID subtopicId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(nullable = false)
    private int depth;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    // The beginner answer. Markdown, so a step can carry code.
    @Column(name = "answer_simple", columnDefinition = "TEXT")
    private String answerSimple;

    @Column(name = "answer_how", columnDefinition = "TEXT")
    private String answerHow;

    @Column(name = "answer_usage", columnDefinition = "TEXT")
    private String answerUsage;

    @Column(name = "answer_example", columnDefinition = "TEXT")
    private String answerExample;

    @Column(name = "answer_script", columnDefinition = "TEXT")
    private String answerScript;

    @Column(name = "answer_remember", length = 300)
    private String answerRemember;

    @Column(name = "answer_caution", columnDefinition = "TEXT")
    private String answerCaution;

    // The earlier three-part answer, kept for banks not yet rewritten.
    @Column(name = "answer_short", columnDefinition = "TEXT")
    private String answerShort;

    @Column(name = "answer_deep", columnDefinition = "TEXT")
    private String answerDeep;

    @Column(name = "answer_signal", columnDefinition = "TEXT")
    private String answerSignal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;
}
