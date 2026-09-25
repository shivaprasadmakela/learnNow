package com.learnnow.privacy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

/** The rules that make consent consent, rather than a checkbox we ignore. */
class ConsentServiceTest {

    private static final String USER = "user-1";

    private UserConsentRepository consentRepository;
    private UserConsentEventRepository eventRepository;
    private PrivacyNoticeService privacyNotice;
    private ConsentService consentService;

    @BeforeEach
    void setUp() {
        consentRepository = Mockito.mock(UserConsentRepository.class);
        eventRepository = Mockito.mock(UserConsentEventRepository.class);
        privacyNotice = Mockito.mock(PrivacyNoticeService.class);
        when(privacyNotice.currentVersion()).thenReturn("2026-09-25");
        when(consentRepository.save(any(UserConsent.class))).thenAnswer(inv -> inv.getArgument(0));

        consentService = new ConsentService(consentRepository, eventRepository, privacyNotice);
    }

    @Test
    @DisplayName("a purpose never answered reads as refused, not as consented")
    void unansweredPurposeIsNotConsent() {
        when(consentRepository.findByUserId(USER)).thenReturn(List.of());

        ConsentCentreResponse centre = consentService.getConsentCentre(USER);

        // Every purpose is present - a screen built from stored rows only would stop
        // offering a purpose added after the learner signed up.
        assertThat(centre.consents()).hasSize(ConsentPurpose.values().length);
        assertThat(centre.consents()).allMatch(c -> !c.granted());
    }

    @Test
    @DisplayName("withdrawing a required purpose is rejected rather than silently ignored")
    void requiredPurposeCannotBeWithdrawn() {
        assertThatThrownBy(
                        () ->
                                consentService.applyDecisions(
                                        USER,
                                        List.of(
                                                new ConsentDecisionRequest(
                                                        ConsentPurpose.ESSENTIAL, false)),
                                        ConsentSource.CONSENT_CENTRE))
                .isInstanceOf(ValidationException.class)
                .hasMessage("consent_required_purpose_cannot_be_withdrawn");

        // Nothing was written. Storing granted=true against someone who asked for false
        // would be recording a consent they did not give.
        verify(consentRepository, never()).save(any());
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("withdrawal is recorded in the ledger, not just erased from current state")
    void withdrawalWritesAnEvent() {
        when(consentRepository.findByUserIdAndPurpose(USER, ConsentPurpose.PRODUCT_ANALYTICS))
                .thenReturn(
                        Optional.of(
                                UserConsent.builder()
                                        .userId(USER)
                                        .purpose(ConsentPurpose.PRODUCT_ANALYTICS)
                                        .granted(true)
                                        .noticeVersion("2026-01-01")
                                        .build()));
        when(consentRepository.findByUserId(USER)).thenReturn(List.of());

        consentService.applyDecisions(
                USER,
                List.of(new ConsentDecisionRequest(ConsentPurpose.PRODUCT_ANALYTICS, false)),
                ConsentSource.CONSENT_CENTRE);

        ArgumentCaptor<UserConsentEvent> event = ArgumentCaptor.forClass(UserConsentEvent.class);
        verify(eventRepository).save(event.capture());
        assertThat(event.getValue().isGranted()).isFalse();
        assertThat(event.getValue().getSource()).isEqualTo(ConsentSource.CONSENT_CENTRE);
        // Stamped with today's notice, not the one the original grant was given against.
        assertThat(event.getValue().getNoticeVersion()).isEqualTo("2026-09-25");
    }

    @Test
    @DisplayName("signup grants ESSENTIAL and refuses every optional purpose explicitly")
    void signupRecordsEveryPurpose() {
        when(consentRepository.findByUserId(USER)).thenReturn(List.of());

        consentService.recordSignupConsent(USER, ConsentSource.SIGNUP_NOTICE);

        ArgumentCaptor<UserConsent> saved = ArgumentCaptor.forClass(UserConsent.class);
        verify(consentRepository, times(ConsentPurpose.values().length)).save(saved.capture());

        Map<ConsentPurpose, Boolean> stored =
                saved.getAllValues().stream()
                        .collect(Collectors.toMap(UserConsent::getPurpose, UserConsent::isGranted));

        assertThat(stored)
                .containsEntry(ConsentPurpose.ESSENTIAL, true)
                // Not merely absent: an explicit no for each, so the consent centre opens on a
                // real state and the ledger shows what was recorded at signup.
                .containsEntry(ConsentPurpose.PRODUCT_ANALYTICS, false)
                .containsEntry(ConsentPurpose.MARKETING_EMAILS, false)
                .containsEntry(ConsentPurpose.PERSONALISATION, false);
    }

    @Test
    @DisplayName("the signup tick never bundles an optional purpose behind it")
    void signupGrantsNothingOptional() {
        when(consentRepository.findByUserId(USER)).thenReturn(List.of());

        consentService.recordSignupConsent(USER, ConsentSource.SIGNUP_NOTICE);

        ArgumentCaptor<UserConsentEvent> events = ArgumentCaptor.forClass(UserConsentEvent.class);
        verify(eventRepository, times(ConsentPurpose.values().length)).save(events.capture());

        // The form takes one tick confirming the notice was read. If that tick ever starts
        // granting analytics or marketing too, it becomes one consent covering four unrelated
        // things, which s.6(1) does not accept as consent to any of them. Both signup paths -
        // the form and Google - come through here, so this covers both.
        assertThat(
                        events.getAllValues().stream()
                                .filter(UserConsentEvent::isGranted)
                                .map(UserConsentEvent::getPurpose)
                                .toList())
                .containsExactly(ConsentPurpose.ESSENTIAL);
        assertThat(events.getAllValues())
                .allMatch(e -> e.getSource() == ConsentSource.SIGNUP_NOTICE);
    }

    @Test
    @DisplayName("a Google signup is recorded under its own source, granting the same thing")
    void googleSignupUsesItsOwnSource() {
        when(consentRepository.findByUserId(USER)).thenReturn(List.of());

        consentService.recordSignupConsent(USER, ConsentSource.GOOGLE_SIGNUP);

        ArgumentCaptor<UserConsentEvent> events = ArgumentCaptor.forClass(UserConsentEvent.class);
        verify(eventRepository, times(ConsentPurpose.values().length)).save(events.capture());

        // The Google button shows the notice but takes no tick, so the ledger must not claim
        // the confirmation the form's SIGNUP_NOTICE stands for.
        assertThat(events.getAllValues())
                .allMatch(e -> e.getSource() == ConsentSource.GOOGLE_SIGNUP);
        assertThat(
                        events.getAllValues().stream()
                                .filter(UserConsentEvent::isGranted)
                                .map(UserConsentEvent::getPurpose)
                                .toList())
                .containsExactly(ConsentPurpose.ESSENTIAL);
    }

    @Test
    @DisplayName("hasConsent treats an absent row as no")
    void absentRowIsNo() {
        when(consentRepository.findByUserIdAndPurpose(USER, ConsentPurpose.MARKETING_EMAILS))
                .thenReturn(Optional.empty());

        assertThat(consentService.hasConsent(USER, ConsentPurpose.MARKETING_EMAILS)).isFalse();
    }

    @Test
    @DisplayName("the consent centre reports which notice version each answer was given against")
    void centreCarriesNoticeVersionPerConsent() {
        when(consentRepository.findByUserId(USER))
                .thenReturn(
                        List.of(
                                UserConsent.builder()
                                        .userId(USER)
                                        .purpose(ConsentPurpose.MARKETING_EMAILS)
                                        .granted(true)
                                        .noticeVersion("2026-01-01")
                                        .build()));

        ConsentCentreResponse centre = consentService.getConsentCentre(USER);
        ConsentResponse marketing =
                centre.consents().stream()
                        .filter(c -> c.purpose() == ConsentPurpose.MARKETING_EMAILS)
                        .findFirst()
                        .orElseThrow();

        // Stale against the current notice, which is how the UI knows to ask again.
        assertThat(marketing.noticeVersion()).isEqualTo("2026-01-01");
        assertThat(centre.currentNoticeVersion()).isEqualTo("2026-09-25");
    }
}
