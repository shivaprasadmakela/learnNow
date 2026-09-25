package com.learnnow.privacy.dto.response;

import com.learnnow.privacy.entity.ConsentPurpose;
import com.learnnow.privacy.entity.UserConsent;
import java.time.Instant;

/**
 * One purpose as the consent centre shows it.
 *
 * <p>{@code required} travels with the row so the UI does not have to keep its own copy of which
 * purposes cannot be switched off — two lists that would eventually disagree, and the failure mode
 * is offering someone a toggle that silently does nothing.
 */
public record ConsentResponse(
        ConsentPurpose purpose,
        boolean granted,
        boolean required,
        String noticeVersion,
        Instant decidedAt) {

    public static ConsentResponse from(UserConsent consent) {
        return new ConsentResponse(
                consent.getPurpose(),
                consent.isGranted(),
                consent.getPurpose().isRequired(),
                consent.getNoticeVersion(),
                consent.getDecidedAt());
    }

    /**
     * A purpose the learner has never answered for. Treated as not granted: s.6 requires a clear
     * affirmative action, so silence is a no, never a yes.
     */
    public static ConsentResponse unanswered(ConsentPurpose purpose, String noticeVersion) {
        return new ConsentResponse(purpose, false, purpose.isRequired(), noticeVersion, null);
    }
}
