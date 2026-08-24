package com.learnnow.dsa.dto.response;

public record DsaProblemProgressDto(String status, int attemptCount, String lastLanguage) {

    public static DsaProblemProgressDto notStarted() {
        return new DsaProblemProgressDto("NOT_STARTED", 0, null);
    }
}
