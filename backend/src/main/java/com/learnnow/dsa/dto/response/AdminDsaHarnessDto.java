package com.learnnow.dsa.dto.response;

import java.util.UUID;

public record AdminDsaHarnessDto(
        UUID id,
        String language,
        String starterCode,
        String driverCode,
        String referenceSolution) {}
