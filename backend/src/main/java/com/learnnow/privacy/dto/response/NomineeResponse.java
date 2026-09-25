package com.learnnow.privacy.dto.response;

import com.learnnow.privacy.entity.UserNominee;
import java.time.Instant;

public record NomineeResponse(
        String name, String email, String relationship, Instant createdAt, Instant updatedAt) {

    public static NomineeResponse from(UserNominee nominee) {
        return new NomineeResponse(
                nominee.getName(),
                nominee.getEmail(),
                nominee.getRelationship(),
                nominee.getCreatedAt(),
                nominee.getUpdatedAt());
    }
}
