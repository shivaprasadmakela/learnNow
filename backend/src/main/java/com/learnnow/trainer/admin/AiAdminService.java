package com.learnnow.trainer.admin;

import com.learnnow.trainer.feature.AiFeature;
import com.learnnow.trainer.feature.AiFeatureService;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.TrainerQuotaService;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** What the admin AI page shows: spend, switches, interview counts and disputed evaluations. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiAdminService {

    private static final short UNFAIR = -1;

    private final AiClient aiClient;
    private final AiFeatureService featureService;
    private final TopicInterviewRepository interviewRepository;
    private final TrainerQuotaService quotaService;

    @Transactional(readOnly = true)
    public AiAdminResponse overview() {
        TrainerQuotaService.Limits limits = quotaService.limits();
        return new AiAdminResponse(
                featureService.all(),
                usage(),
                new AiAdminResponse.Interviews(interviewsThisMonth()),
                interviewRepository.findTop20ByLearnerRatingOrderByCreatedAtDesc(UNFAIR).stream()
                        .map(
                                i ->
                                        new AiAdminResponse.Flagged(
                                                i.getId(),
                                                i.getKind().name(),
                                                i.getTitle(),
                                                i.getOverallScore(),
                                                i.getLearnerComment(),
                                                i.getCreatedAt()))
                        .toList(),
                new AiAdminResponse.Quotas(
                        limits.topicInterviews(),
                        limits.mockInterviews(),
                        limits.resumeAnalyses()));
    }

    public void setFlag(AiFeature feature, boolean enabled, String adminId) {
        featureService.setEnabled(feature, enabled, adminId);
        log.info("AI feature {} switched {}", feature, enabled ? "on" : "off");
    }

    /** learnnow-ai's spend report; null when it is not configured or cannot be reached. */
    private Map<String, Object> usage() {
        if (!aiClient.configured()) {
            return null;
        }
        try {
            return aiClient.usage();
        } catch (RuntimeException e) {
            log.warn("AI usage report unavailable: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Map<String, Long>> interviewsThisMonth() {
        LocalDate first = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1);
        Map<String, Map<String, Long>> out = new LinkedHashMap<>();
        List<Object[]> rows =
                interviewRepository.countByKindAndStatusSince(
                        first.atStartOfDay().toInstant(ZoneOffset.UTC));
        for (Object[] row : rows) {
            String kind = ((InterviewKind) row[0]).name();
            String status = ((InterviewStatus) row[1]).name();
            out.computeIfAbsent(kind, k -> new TreeMap<>()).put(status, (Long) row[2]);
        }
        return out;
    }
}
