package com.learnnow.privacy.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.privacy.dto.request.GrievanceRequest;
import com.learnnow.privacy.dto.response.GrievanceResponse;
import com.learnnow.privacy.entity.Grievance;
import com.learnnow.privacy.repository.GrievanceRepository;
import java.time.Year;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grievance redressal, s.13.
 *
 * <p>Nothing here resolves a grievance; answering one is a human act, and the response and status
 * are written by whoever handles it. What this guarantees is that a complaint is recorded, gets an
 * identifier the learner can quote, and stays visible to them afterwards — the conditions on which
 * escalating to the Data Protection Board depends.
 */
@Service
@RequiredArgsConstructor
public class GrievanceService {

    /**
     * How many times to retry if two learners mint the same reference at once. The unique index is
     * what actually prevents a duplicate; this just converts the collision into a second attempt
     * rather than a failed complaint. Three is generous for a counter that only collides when two
     * requests interleave inside the same millisecond.
     */
    private static final int REFERENCE_ATTEMPTS = 3;

    private final GrievanceRepository grievanceRepository;

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getGrievances(String userId) {
        return grievanceRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(GrievanceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public GrievanceResponse getGrievance(String userId, String reference) {
        return grievanceRepository
                .findByUserIdAndReference(userId, reference)
                .map(GrievanceResponse::from)
                .orElseThrow(() -> new NotFoundException("grievance_not_found"));
    }

    @Transactional
    public GrievanceResponse raise(String userId, GrievanceRequest request) {
        DataIntegrityViolationException last = null;

        for (int attempt = 0; attempt < REFERENCE_ATTEMPTS; attempt++) {
            try {
                Grievance grievance =
                        Grievance.builder()
                                .reference(nextReference())
                                .userId(userId)
                                .category(request.category())
                                .subject(request.subject().trim())
                                .body(request.body().trim())
                                .build();
                return GrievanceResponse.from(grievanceRepository.saveAndFlush(grievance));
            } catch (DataIntegrityViolationException collision) {
                last = collision;
            }
        }
        throw last;
    }

    /**
     * Human-quotable and sequential within a year: GRV-2026-0001.
     *
     * <p>Sequential rather than random because the learner reads this out over email or the phone,
     * and a UUID does not survive that. The count is per year so the number stays short.
     */
    private String nextReference() {
        String prefix = "GRV-" + Year.now() + "-";
        long next = grievanceRepository.countByReferenceStartingWith(prefix) + 1;
        return prefix + String.format("%04d", next);
    }
}
