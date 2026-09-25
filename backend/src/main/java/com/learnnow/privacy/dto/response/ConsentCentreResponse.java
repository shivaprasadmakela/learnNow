package com.learnnow.privacy.dto.response;

import java.util.List;

/**
 * Everything the consent screen needs in one call.
 *
 * <p>{@code currentNoticeVersion} is what the notice says today; each consent carries the version
 * it was given against. When they differ the UI can say so, which is the difference between asking
 * again because the terms changed and nagging.
 */
public record ConsentCentreResponse(String currentNoticeVersion, List<ConsentResponse> consents) {}
