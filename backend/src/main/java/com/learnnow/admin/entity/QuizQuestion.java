package com.learnnow.admin.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "quiz_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "block")
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String kind; // "mcq" | "true_false" | "fill_blank"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String options; // JSON string array of options

    @Column(name = "correct_answer", columnDefinition = "TEXT", nullable = false)
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    @Builder.Default
    private int points = 5;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id", nullable = false)
    @JsonIgnore
    private ContentBlock block;
}
