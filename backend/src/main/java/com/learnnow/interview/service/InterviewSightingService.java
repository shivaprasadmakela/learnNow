package com.learnnow.interview.service;

import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.dto.request.RecordSightingRequest;
import com.learnnow.interview.dto.response.SightingResultDto;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.entity.InterviewReport;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.interview.repository.InterviewReportRepository;
import java.net.URI;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records that questions were asked in a real interview - what turns a question from good
 * preparation into "Asked at Flipkart · Sep 2026".
 *
 * <p>That badge is a claim learners will trust, so this is strict about what it accepts: a real
 * company, a month that has happened, a source that is a web link, and questions that exist. Two
 * requests from the same source are the same report; the second adds questions to the first rather
 * than counting one interview twice.
 */
@Service
public class InterviewSightingService {

    private final InterviewReportRepository reportRepository;
    private final InterviewQuestionRepository questionRepository;
    private final Clock clock;

    @Autowired
    public InterviewSightingService(
            InterviewReportRepository reportRepository,
            InterviewQuestionRepository questionRepository) {
        this(reportRepository, questionRepository, Clock.systemUTC());
    }

    InterviewSightingService(
            InterviewReportRepository reportRepository,
            InterviewQuestionRepository questionRepository,
            Clock clock) {
        this.reportRepository = reportRepository;
        this.questionRepository = questionRepository;
        this.clock = clock;
    }

    /** Every problem is reported together, and nothing is written unless there are none. */
    @Transactional
    public SightingResultDto record(RecordSightingRequest request) {
        List<String> problems = new ArrayList<>();

        String company = trimToNull(request.company());
        if (company == null) problems.add("a company is required");

        YearMonth month = null;
        if (request.seenMonth() != null) {
            try {
                month = YearMonth.parse(request.seenMonth().trim());
                if (month.isAfter(YearMonth.now(clock))) {
                    problems.add("month " + month + " has not happened yet");
                }
            } catch (DateTimeParseException e) {
                problems.add("month \"" + request.seenMonth() + "\" is not YYYY-MM");
            }
        }

        String source = trimToNull(request.sourceUrl());
        if (source != null && !isWebLink(source)) {
            problems.add("source \"" + source + "\" is not an http(s) link");
        }

        Set<String> keys = new LinkedHashSet<>();
        if (request.questionKeys() != null) {
            request.questionKeys().stream()
                    .map(InterviewSightingService::trimToNull)
                    .filter(Objects::nonNull)
                    .forEach(keys::add);
        }
        if (keys.isEmpty()) problems.add("name at least one question");
        Map<String, InterviewQuestion> questions =
                questionRepository.findByQuestionKeyIn(keys).stream()
                        .collect(
                                Collectors.toMap(
                                        InterviewQuestion::getQuestionKey, Function.identity()));
        for (String key : keys) {
            if (!questions.containsKey(key))
                problems.add("no question has the key \"" + key + "\"");
        }

        Optional<InterviewReport> existing =
                source == null ? Optional.empty() : reportRepository.findBySourceUrl(source);
        if (existing.isPresent() && problems.isEmpty()) {
            InterviewReport r = existing.get();
            if (!r.getCompany().equalsIgnoreCase(company)
                    || !Objects.equals(r.getSeenMonth(), month == null ? null : month.atDay(1))) {
                problems.add(
                        "a report from this source already exists for "
                                + r.getCompany()
                                + (r.getSeenMonth() == null
                                        ? ""
                                        : ", " + YearMonth.from(r.getSeenMonth())));
            }
        }

        if (!problems.isEmpty()) {
            throw new ValidationException(
                    "Sighting was not recorded: " + String.join("; ", problems));
        }

        LocalDate seen = month == null ? null : month.atDay(1);
        InterviewReport report =
                existing.orElseGet(
                        () ->
                                InterviewReport.builder()
                                        .company(company)
                                        .role(trimToNull(request.role()))
                                        .level(trimToNull(request.level()))
                                        .round(trimToNull(request.round()))
                                        .seenMonth(seen)
                                        .sourceUrl(source)
                                        .build());
        int before = report.getQuestions().size();
        report.getQuestions().addAll(questions.values());
        int added = report.getQuestions().size() - before;
        report = reportRepository.save(report);

        return new SightingResultDto(
                report.getId(), existing.isEmpty(), added, questions.size() - added);
    }

    private static boolean isWebLink(String s) {
        try {
            URI uri = URI.create(s);
            return ("https".equalsIgnoreCase(uri.getScheme())
                            || "http".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
