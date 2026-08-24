package com.learnnow.dsa.entity;

/** Outcome of one Run or Submit. */
public enum DsaVerdict {
    ACCEPTED,
    WRONG_ANSWER,
    COMPILE_ERROR,
    RUNTIME_ERROR,
    TIME_LIMIT,

    /**
     * The execution engine failed us, not the learner. Recorded for diagnostics but never counted
     * as an attempt, and never shown as a failure of their code.
     */
    ENGINE_ERROR
}
