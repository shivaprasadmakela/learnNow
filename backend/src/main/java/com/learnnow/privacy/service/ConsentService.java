package com.learnnow.privacy.service;

import com.learnnow.common.exception.ValidationException;
import com.learnnow.privacy.dto.request.ConsentDecisionRequest;
import com.learnnow.privacy.dto.response.ConsentCentreResponse;
import com.learnnow.privacy.dto.response.ConsentResponse;
import com.learnnow.privacy.entity.ConsentPurpose;
import com.learnnow.privacy.entity.ConsentSource;
import com.learnnow.privacy.entity.UserConsent;
import com.learnnow.privacy.entity.UserConsentEvent;
import com.learnnow.privacy.repository.UserConsentEventRepository;
import com.learnnow.privacy.repository.UserConsentRepository;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Giving, reading and withdrawing consent (s.6).
 *
 * <p>Two rules drive everything here. Withdrawal must be as easy as giving, so there is one
 * endpoint that takes a decision either way rather than a grant path and a separate, harder
 * withdrawal path. And consent must be demonstrable, so every decision writes an immutable event
 * beside the mutable current state.
 */
@Service
@RequiredArgsConstructor
public class ConsentService {

    private final UserConsentRepository consentRepository;
    private final UserConsentEventRepository eventRepository;
    private final PrivacyNoticeService privacyNotice;

    /**
     * Every purpose, whether or not the learner has answered for it.
     *
     * <p>Purposes never answered come back as not granted rather than being absent. A screen built
     * from only the stored rows would silently stop offering a purpose added since the learner
     * signed up, which is how a consent centre ends up unable to collect consent.
     */
    @Transactional(readOnly = true)
    public ConsentCentreResponse getConsentCentre(String userId) {
        Map<ConsentPurpose, UserConsent> stored = new EnumMap<>(ConsentPurpose.class);
        consentRepository.findByUserId(userId).forEach(c -> stored.put(c.getPurpose(), c));

        String version = privacyNotice.currentVersion();
        List<ConsentResponse> consents =
                java.util.Arrays.stream(ConsentPurpose.values())
                        .map(
                                purpose -> {
                                    UserConsent consent = stored.get(purpose);
                                    return consent == null
                                            ? ConsentResponse.unanswered(purpose, version)
                                            : ConsentResponse.from(consent);
                                })
                        .toList();

        return new ConsentCentreResponse(version, consents);
    }

    /**
     * Applies a set of decisions and returns the resulting state.
     *
     * <p>Refusing a required purpose is rejected rather than quietly ignored. The only honest way
     * to withdraw consent for running the account is to close the account, which is offered
     * separately — silently storing {@code granted = true} against someone who asked for false
     * would be recording a consent they did not give.
     */
    @Transactional
    public ConsentCentreResponse applyDecisions(
            String userId, List<ConsentDecisionRequest> decisions, ConsentSource source) {

        String version = privacyNotice.currentVersion();

        for (ConsentDecisionRequest decision : decisions) {
            ConsentPurpose purpose = decision.purpose();
            boolean granted = decision.granted();

            if (purpose.isRequired() && !granted) {
                throw new ValidationException("consent_required_purpose_cannot_be_withdrawn");
            }

            UserConsent consent =
                    consentRepository
                            .findByUserIdAndPurpose(userId, purpose)
                            .orElseGet(
                                    () ->
                                            UserConsent.builder()
                                                    .userId(userId)
                                                    .purpose(purpose)
                                                    .build());

            // Re-affirming an unchanged answer still updates the notice version and the
            // timestamp: it is a fresh decision against whatever the notice says today, and
            // that is exactly what makes a re-consent after a notice change meaningful.
            consent.setGranted(granted);
            consent.setNoticeVersion(version);
            consent.setDecidedAt(Instant.now());
            consentRepository.save(consent);

            eventRepository.save(
                    UserConsentEvent.builder()
                            .userId(userId)
                            .purpose(purpose)
                            .granted(granted)
                            .noticeVersion(version)
                            .source(source)
                            .build());
        }

        return getConsentCentre(userId);
    }

    /**
     * Records the consent given when an account is created.
     *
     * <p>Two things happen that {@link #applyDecisions} alone would not do. ESSENTIAL is recorded
     * as granted regardless of what was submitted, because creating the account *is* the
     * affirmative action for it and the alternative is an account that exists without consent to
     * run it. And every optional purpose the caller did not mention is written as an explicit
     * refusal rather than left absent.
     *
     * <p>That second part matters more than it looks. A missing row and a refusal both read as "no"
     * to {@link #hasConsent}, but only one of them is a decision. Writing them means the consent
     * centre shows the learner what they actually chose at signup, and the event ledger can show
     * that they were asked — which is the thing s.6 puts on us to demonstrate.
     */
    @Transactional
    public void recordSignupConsent(String userId, List<ConsentDecisionRequest> submitted) {
        Map<ConsentPurpose, Boolean> answers = new EnumMap<>(ConsentPurpose.class);
        if (submitted != null) {
            submitted.forEach(d -> answers.put(d.purpose(), d.granted()));
        }

        List<ConsentDecisionRequest> decisions =
                java.util.Arrays.stream(ConsentPurpose.values())
                        .map(
                                purpose ->
                                        new ConsentDecisionRequest(
                                                purpose,
                                                purpose.isRequired()
                                                        || Boolean.TRUE.equals(
                                                                answers.get(purpose))))
                        .toList();

        applyDecisions(userId, decisions, ConsentSource.SIGNUP_NOTICE);
    }

    /**
     * Whether a given purpose is currently permitted.
     *
     * <p>Absent means no. s.6(1) wants a clear affirmative action, so the absence of a row is the
     * absence of consent, never a default yes.
     */
    @Transactional(readOnly = true)
    public boolean hasConsent(String userId, ConsentPurpose purpose) {
        return consentRepository
                .findByUserIdAndPurpose(userId, purpose)
                .map(UserConsent::isGranted)
                .orElse(false);
    }
}
