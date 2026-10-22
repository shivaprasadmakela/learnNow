package com.learnnow.interview.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * An interview bank as built in learnNow-content's interview/*.json. Importing upserts every
 * question by {@code key}, at any depth, so re-importing a bank edits it in place.
 *
 * <p>An answer is either the beginner sections (simple, how, usage, example, script, remember,
 * caution) or, for banks not yet rewritten, the earlier answerShort / answerDeep / answerSignal.
 *
 * <p>Opening questions name their subtopic by title within the bank's path, the way an author knows
 * it, rather than by an id that differs between local, dev and prod. Follow-ups inherit their
 * opening question's subtopic.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ImportInterviewBankRequest(
        @NotBlank String bank,
        @NotBlank String pathTitle,
        @NotEmpty @Valid List<Question> questions) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Question(
            @NotBlank @Size(max = 160) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String key,
            String subtopic,
            Integer depth,
            @NotBlank String prompt,
            String simple,
            String how,
            String usage,
            String example,
            String script,
            @Size(max = 300) String remember,
            String caution,
            String answerShort,
            String answerDeep,
            String answerSignal,
            @Valid List<Question> followUps) {

        /** The beginner sections: simple, how, example, script and remember are all present. */
        public boolean hasBeginnerAnswer() {
            return present(simple)
                    && present(how)
                    && present(example)
                    && present(script)
                    && present(remember);
        }

        /** The earlier three-part answer, all three present. */
        public boolean hasLegacyAnswer() {
            return present(answerShort) && present(answerDeep) && present(answerSignal);
        }

        private static boolean present(String s) {
            return s != null && !s.isBlank();
        }
    }
}
