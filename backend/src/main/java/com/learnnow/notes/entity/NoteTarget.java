package com.learnnow.notes.entity;

/**
 * What a note or bookmark is attached to.
 *
 * <p>Not persisted as a column. The database records the target as one of several nullable foreign
 * keys, so which column is populated already carries this information without a discriminator that
 * could disagree with it. This enum exists for the API and for filtering.
 */
public enum NoteTarget {
    SUBTOPIC,
    TOPIC,
    DSA_PROBLEM
}
