package com.learnnow.privacy.service;

import com.learnnow.privacy.dto.response.PrivacyContactResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * The published facts about who processes this data and how to reach them.
 *
 * <p>s.8(9) requires the business contact of the Data Protection Officer, or of whoever can answer
 * a learner's questions, to be published. s.5 requires the notice itself to be versioned in
 * practice, because a consent is only meaningful against the text that was on screen when it was
 * given — {@link ConsentService} stamps every decision with {@link #currentVersion()}.
 *
 * <p>All of it is configuration rather than constants. These are real-world business details that
 * differ between environments and change without a deploy, and a hardcoded contact address that has
 * gone stale is a compliance failure rather than a typo.
 */
@Service
public class PrivacyNoticeService {

    /**
     * Bumped by hand whenever the privacy notice text changes materially. Consents recorded against
     * an older version are still valid, but the consent centre can see that they predate the
     * current notice and ask again.
     */
    @Value("${app.privacy.notice-version}")
    private String noticeVersion;

    @Value("${app.privacy.entity-name}")
    private String entityName;

    @Value("${app.privacy.grievance-officer-name}")
    private String officerName;

    @Value("${app.privacy.grievance-officer-email}")
    private String officerEmail;

    @Value("${app.privacy.grievance-officer-address}")
    private String officerAddress;

    /**
     * How long we tell learners a grievance will take. Published rather than inferred so the
     * promise on the page and the promise in the code are the same number.
     */
    @Value("${app.privacy.grievance-response-days}")
    private int grievanceResponseDays;

    public String currentVersion() {
        return noticeVersion;
    }

    public PrivacyContactResponse contact() {
        return new PrivacyContactResponse(
                entityName,
                officerName,
                officerEmail,
                officerAddress,
                grievanceResponseDays,
                noticeVersion);
    }
}
