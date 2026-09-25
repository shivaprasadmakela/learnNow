package com.learnnow.privacy.controller;

import com.learnnow.privacy.dto.request.ConsentUpdateRequest;
import com.learnnow.privacy.dto.request.GrievanceRequest;
import com.learnnow.privacy.dto.request.NomineeRequest;
import com.learnnow.privacy.dto.response.ConsentCentreResponse;
import com.learnnow.privacy.dto.response.DataExportResponse;
import com.learnnow.privacy.dto.response.GrievanceResponse;
import com.learnnow.privacy.dto.response.NomineeResponse;
import com.learnnow.privacy.dto.response.PrivacyContactResponse;
import com.learnnow.privacy.entity.ConsentSource;
import com.learnnow.privacy.service.*;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * The learner's rights under the DPDP Act, as endpoints.
 *
 * <p>Everything lives under {@code /api/me/privacy} except the contact details, which are public: a
 * person who cannot sign in is the one most likely to need to complain, so putting the grievance
 * officer's address behind authentication would defeat s.8(9).
 *
 * <p>There is no admin surface here for answering grievances. That is a real gap rather than an
 * oversight — see the note on {@link #raiseGrievance} — and the learner-facing half is useless
 * without it, so it is called out rather than left to be discovered.
 */
@RestController
@RequiredArgsConstructor
public class PrivacyController {

    private final ConsentService consentService;
    private final NomineeService nomineeService;
    private final GrievanceService grievanceService;
    private final DataExportService dataExportService;
    private final AccountErasureService accountErasureService;
    private final PrivacyNoticeService privacyNoticeService;

    // ------------------------------------------------------------- s.8(9) contact

    /** Public on purpose. See the class note. */
    @GetMapping("/api/privacy/contact")
    public ResponseEntity<PrivacyContactResponse> contact() {
        return ResponseEntity.ok(privacyNoticeService.contact());
    }

    // ------------------------------------------------------------------ s.6 consent

    @GetMapping("/api/me/privacy/consents")
    public ResponseEntity<ConsentCentreResponse> getConsents(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(consentService.getConsentCentre(jwt.getSubject()));
    }

    /**
     * One route for both granting and withdrawing.
     *
     * <p>s.6(4) requires withdrawal to be as easy as giving, which is a statement about the shape
     * of the interface and not only about the UI. A separate DELETE for withdrawal would make the
     * two asymmetric at the level where it is easiest for them to drift apart.
     */
    @PutMapping("/api/me/privacy/consents")
    public ResponseEntity<ConsentCentreResponse> updateConsents(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ConsentUpdateRequest request) {
        return ResponseEntity.ok(
                consentService.applyDecisions(
                        jwt.getSubject(), request.decisions(), ConsentSource.CONSENT_CENTRE));
    }

    // ------------------------------------------------------------------ s.11 access

    /**
     * Everything we hold, as a download.
     *
     * <p>Content-Disposition is set so the browser saves it rather than rendering a wall of JSON,
     * which is the difference between a right that is usable and one that is technically available.
     */
    @GetMapping("/api/me/privacy/export")
    public ResponseEntity<DataExportResponse> exportMyData(@AuthenticationPrincipal Jwt jwt) {
        DataExportResponse export = dataExportService.export(jwt.getSubject());
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + dataExportService.exportFilename() + "\"")
                .body(export);
    }

    // ----------------------------------------------------------------- s.12 erasure

    /**
     * Closes the account and erases it.
     *
     * <p>Correction, the other half of s.12, is the existing {@code PUT /api/user} — a learner
     * edits their own details, so it needs no separate route here.
     */
    @DeleteMapping("/api/me/privacy/account")
    public ResponseEntity<Void> eraseAccount(@AuthenticationPrincipal Jwt jwt) {
        accountErasureService.eraseAccount(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    // --------------------------------------------------------------- s.13 grievance

    @GetMapping("/api/me/privacy/grievances")
    public ResponseEntity<List<GrievanceResponse>> getGrievances(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(grievanceService.getGrievances(jwt.getSubject()));
    }

    @GetMapping("/api/me/privacy/grievances/{reference}")
    public ResponseEntity<GrievanceResponse> getGrievance(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String reference) {
        return ResponseEntity.ok(grievanceService.getGrievance(jwt.getSubject(), reference));
    }

    /**
     * Records a complaint and hands back its reference.
     *
     * <p>Nothing routes it to a human yet: there is no admin screen and no notification, so a
     * grievance raised here is visible only to whoever reads the {@code grievances} table. The
     * learner-facing promise of a response within the published number of days is therefore not
     * something this code can keep on its own.
     */
    @PostMapping("/api/me/privacy/grievances")
    public ResponseEntity<GrievanceResponse> raiseGrievance(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody GrievanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(grievanceService.raise(jwt.getSubject(), request));
    }

    // -------------------------------------------------------------- s.14 nomination

    /** 204 rather than 404 when nobody is nominated: having no nominee is a normal state. */
    @GetMapping("/api/me/privacy/nominee")
    public ResponseEntity<NomineeResponse> getNominee(@AuthenticationPrincipal Jwt jwt) {
        return nomineeService
                .getNominee(jwt.getSubject())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/api/me/privacy/nominee")
    public ResponseEntity<NomineeResponse> saveNominee(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NomineeRequest request) {
        return ResponseEntity.ok(nomineeService.saveNominee(jwt.getSubject(), request));
    }

    @DeleteMapping("/api/me/privacy/nominee")
    public ResponseEntity<Void> deleteNominee(@AuthenticationPrincipal Jwt jwt) {
        nomineeService.deleteNominee(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}
