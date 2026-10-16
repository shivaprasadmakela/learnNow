package com.learnnow.interview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * A sighting: one occasion on which questions were reported as asked - a company, a round, a month.
 *
 * <p>{@code sourceUrl} is where an admin read it, kept so a report can be checked. It is never sent
 * to learners; the read path selects sightings through a projection with no field for it.
 */
@Entity
@Table(name = "interview_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "questions")
public class InterviewReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String company;

    @Column(length = 160)
    private String role;

    @Column(length = 80)
    private String level;

    @Column(length = 80)
    private String round;

    /** The first of the month it was asked; the day is not known and not claimed. */
    @Column(name = "seen_month")
    private LocalDate seenMonth;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "interview_question_reports",
            joinColumns = @JoinColumn(name = "report_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id"))
    @Builder.Default
    private Set<InterviewQuestion> questions = new HashSet<>();
}
