package com.learnnow.notes.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * The target of a note is derived from which foreign key is populated, rather than stored in a
 * discriminator column that could disagree with the keys. That makes the derivation load-bearing:
 * get it wrong and a DSA note is filed as a topic note.
 */
class NoteTargetTest {

    @Test
    void derivesTheTargetFromWhicheverKeyIsSet() {
        UUID id = UUID.randomUUID();

        assertThat(Note.builder().subtopicId(id).build().getTarget())
                .isEqualTo(NoteTarget.SUBTOPIC);
        assertThat(Note.builder().topicId(id).build().getTarget()).isEqualTo(NoteTarget.TOPIC);
        assertThat(Note.builder().dsaProblemId(id).build().getTarget())
                .isEqualTo(NoteTarget.DSA_PROBLEM);
    }

    @Test
    void exposesTheTargetIdWhicheverColumnHoldsIt() {
        UUID id = UUID.randomUUID();

        assertThat(Note.builder().subtopicId(id).build().getTargetId()).isEqualTo(id);
        assertThat(Note.builder().topicId(id).build().getTargetId()).isEqualTo(id);
        assertThat(Note.builder().dsaProblemId(id).build().getTargetId()).isEqualTo(id);
    }

    @Test
    void repointingClearsThePreviousTarget() {
        // Without the clear, a note moved between targets would have two keys set and be rejected
        // by ck_notes_exactly_one_target at flush time -- far from where the mistake was made.
        Note note = Note.builder().topicId(UUID.randomUUID()).build();
        UUID problemId = UUID.randomUUID();

        note.pointAt(NoteTarget.DSA_PROBLEM, problemId);

        assertThat(note.getTopicId()).isNull();
        assertThat(note.getSubtopicId()).isNull();
        assertThat(note.getDsaProblemId()).isEqualTo(problemId);
        assertThat(note.getTarget()).isEqualTo(NoteTarget.DSA_PROBLEM);
    }

    @Test
    void bookmarksDeriveTheirTargetTheSameWay() {
        UUID id = UUID.randomUUID();

        Bookmark topic = Bookmark.builder().topicId(id).build();
        assertThat(topic.getTarget()).isEqualTo(NoteTarget.TOPIC);
        assertThat(topic.getTargetId()).isEqualTo(id);

        Bookmark problem = Bookmark.builder().dsaProblemId(id).build();
        assertThat(problem.getTarget()).isEqualTo(NoteTarget.DSA_PROBLEM);
        assertThat(problem.getTargetId()).isEqualTo(id);
    }
}
