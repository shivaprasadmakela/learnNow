package com.learnnow;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for tests that need a real database.
 *
 * <p>These previously connected to whatever Postgres happened to be on the developer's machine,
 * using a password hardcoded into the local profile - so they could not run in CI and passed only
 * on one laptop. A throwaway container replaces that. The migrations use Postgres-specific features
 * (JSONB, {@code gen_random_uuid}, TIMESTAMPTZ), so an in-memory substitute cannot exercise them.
 *
 * <p>{@code disabledWithoutDocker} skips these classes outright when no daemon is reachable, so a
 * developer without a container runtime still gets a green build from the unit tests. It resolves
 * as a JUnit execution condition, before Spring tries to build a context. CI asserts Docker is
 * present before running the suite, so this cannot quietly hide these tests there.
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @Container @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("learnnow_test");
}
