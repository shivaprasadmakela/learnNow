package com.learnnow.privacy.entity;

/**
 * Where a grievance has got to.
 *
 * <p>RESOLVED and CLOSED are both terminal and both stamp {@code resolvedAt}. They are kept apart
 * because they mean different things to the learner: RESOLVED says we did something about it,
 * CLOSED says we are not going to. A learner may escalate to the Data Protection Board from either.
 */
public enum GrievanceStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    public boolean isTerminal() {
        return this == RESOLVED || this == CLOSED;
    }
}
