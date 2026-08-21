package com.learnnow.user.service;

import com.learnnow.user.repository.EmailVerificationTokenRepository;
import com.learnnow.user.repository.PasswordResetTokenRepository;
import com.learnnow.user.repository.RefreshTokenRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Removes spent and expired tokens.
 *
 * <p>Nothing previously deleted these rows, so all three tables grew without bound and kept dead
 * credential material around indefinitely.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenCleanupService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    /** Runs nightly at 03:15. */
    @Scheduled(cron = "0 15 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        Instant now = Instant.now();
        int resets = passwordResetTokenRepository.deleteExpiredOrUsed(now);
        int refresh = refreshTokenRepository.deleteExpiredOrRevoked(now);
        int verifications = emailVerificationTokenRepository.deleteExpiredOrUsed(now);
        log.info(
                "Token cleanup removed {} password reset, {} refresh, {} verification rows",
                resets,
                refresh,
                verifications);
    }
}
