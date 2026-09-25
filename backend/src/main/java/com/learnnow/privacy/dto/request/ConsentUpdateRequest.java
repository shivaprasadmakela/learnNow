package com.learnnow.privacy.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/** The consent centre submits every purpose it displayed, not only the ones that changed. */
public record ConsentUpdateRequest(@NotEmpty @Valid List<ConsentDecisionRequest> decisions) {}
