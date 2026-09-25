package com.learnnow.privacy.entity;

/**
 * What a learner is being asked to consent to, under s.6 of the DPDP Act.
 *
 * <p>Each value is one specific purpose, which is the point: s.6(1) requires consent to be
 * specific, so a single blanket "I agree" covering everything would not be consent at all. The set
 * is mirrored by a CHECK constraint in V2 — adding a value here means a migration.
 */
public enum ConsentPurpose {

    /**
     * Running the account itself: signing in, storing progress, sending service email such as
     * password resets. Not withdrawable while the account exists, because withdrawing it is
     * indistinguishable from closing the account — which is offered separately and honoured in
     * full. Presented to the learner as required rather than pretending it is a choice.
     */
    ESSENTIAL(true),

    /** Usage measurement that improves the courses. Freely withdrawable. */
    PRODUCT_ANALYTICS(false),

    /** Course announcements and newsletters. Freely withdrawable. */
    MARKETING_EMAILS(false),

    /** Tailoring recommendations to what the learner has studied. Freely withdrawable. */
    PERSONALISATION(false);

    private final boolean required;

    ConsentPurpose(boolean required) {
        this.required = required;
    }

    /** Whether refusing this purpose is incompatible with holding an account at all. */
    public boolean isRequired() {
        return required;
    }
}
