package com.learnnow.interview.repository;

import com.learnnow.interview.entity.InterviewReport;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewReportRepository extends JpaRepository<InterviewReport, UUID> {

    Optional<InterviewReport> findBySourceUrl(String sourceUrl);
}
