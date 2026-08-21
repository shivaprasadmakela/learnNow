package com.learnnow.common.config;

import com.learnnow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Promotes one configured account to ADMIN on startup.
 *
 * <p>There was previously no way to create an administrator except editing the database by hand,
 * which meant every role change was a manual production write. The account must already exist, so
 * this grants a role rather than creating a privileged user out of configuration.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap {

    private static final String ROLE_ADMIN = "ADMIN";

    private final UserRepository userRepository;

    @Value("${app.admin.bootstrap-email:}")
    private String bootstrapEmail;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void promoteConfiguredAdmin() {
        if (bootstrapEmail == null || bootstrapEmail.isBlank()) {
            return;
        }

        userRepository
                .findByEmailIgnoreCase(bootstrapEmail.trim())
                .ifPresentOrElse(
                        user -> {
                            if (ROLE_ADMIN.equalsIgnoreCase(user.getRole())) {
                                return;
                            }
                            user.setRole(ROLE_ADMIN);
                            userRepository.save(user);
                            log.warn(
                                    "Promoted {} to ADMIN via app.admin.bootstrap-email",
                                    user.getId());
                        },
                        () ->
                                log.warn(
                                        "app.admin.bootstrap-email is set but no such account"
                                                + " exists yet. Register it first, then restart."));
    }
}
