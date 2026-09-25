package com.learnnow.privacy.service;

import com.learnnow.privacy.dto.request.NomineeRequest;
import com.learnnow.privacy.dto.response.NomineeResponse;
import com.learnnow.privacy.entity.UserNominee;
import com.learnnow.privacy.repository.UserNomineeRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The right to nominate, s.14.
 *
 * <p>Upsert rather than create-then-update: there is one nominee per learner, so naming a second
 * person means replacing the first. A create path that failed because a nomination already existed
 * would make changing your mind harder than making the decision, which is the wrong shape for a
 * right.
 */
@Service
@RequiredArgsConstructor
public class NomineeService {

    private final UserNomineeRepository nomineeRepository;

    @Transactional(readOnly = true)
    public Optional<NomineeResponse> getNominee(String userId) {
        return nomineeRepository.findById(userId).map(NomineeResponse::from);
    }

    @Transactional
    public NomineeResponse saveNominee(String userId, NomineeRequest request) {
        UserNominee nominee =
                nomineeRepository
                        .findById(userId)
                        .orElseGet(() -> UserNominee.builder().userId(userId).build());

        nominee.setName(request.name().trim());
        nominee.setEmail(request.email().trim());
        nominee.setRelationship(
                request.relationship() == null || request.relationship().isBlank()
                        ? null
                        : request.relationship().trim());

        // saveAndFlush, not save: the id is assigned rather than generated, so Spring Data cannot
        // tell a new nominee from an existing one and routes both through merge. The timestamps
        // are written by Hibernate at flush, so a plain save returns them null and the caller
        // renders "nominated: never".
        return NomineeResponse.from(nomineeRepository.saveAndFlush(nominee));
    }

    /** Removing a nomination is a decision too, and needs to be no harder than making one. */
    @Transactional
    public void deleteNominee(String userId) {
        nomineeRepository.deleteById(userId);
    }
}
