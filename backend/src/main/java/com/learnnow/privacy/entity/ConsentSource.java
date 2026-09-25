package com.learnnow.privacy.entity;

/** Where a consent decision came from. Recorded on every event so the ledger can be read back. */
public enum ConsentSource {

    /** The itemised notice shown at registration. */
    SIGNUP_NOTICE,

    /** The consent centre on the profile page, where a learner changes their mind. */
    CONSENT_CENTRE
}

// There is deliberately no ACCOUNT_DELETION source. Consent events cascade with the user row, so
// an event written while erasing an account would be deleted by the same transaction that wrote
// it. Erasure removes the consent record rather than annotating it, which is what s.12 asks for.
