package com.learnnow.privacy.dto.response;

/**
 * Who to contact about personal data, published under s.8(9).
 *
 * <p>Served to anyone, signed in or not: a person who cannot sign in is exactly the person most
 * likely to need to complain, and requiring an account to find out who to complain to would defeat
 * the section.
 */
public record PrivacyContactResponse(
        String entityName,
        String grievanceOfficerName,
        String grievanceOfficerEmail,
        String grievanceOfficerAddress,
        int grievanceResponseDays,
        String noticeVersion) {}
