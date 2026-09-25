package com.learnnow.privacy.entity;

/** Where a consent decision came from. Recorded on every event so the ledger can be read back. */
public enum ConsentSource {

    /** The itemised notice shown at registration. */
    SIGNUP_NOTICE,

    /** The consent centre on the profile page, where a learner changes their mind. */
    CONSENT_CENTRE,

    /**
     * An account created by continuing with Google.
     *
     * <p>Kept apart from SIGNUP_NOTICE because the two are not the same event. The signup form
     * takes an explicit tick against the notice; the Google button carries the notice as a line
     * beneath it and no tick at all. Recording both as SIGNUP_NOTICE would have the ledger claim a
     * confirmation that was never given.
     */
    GOOGLE_SIGNUP
}

// There is deliberately no ACCOUNT_DELETION source. Consent events cascade with the user row, so
// an event written while erasing an account would be deleted by the same transaction that wrote
// it. Erasure removes the consent record rather than annotating it, which is what s.12 asks for.
