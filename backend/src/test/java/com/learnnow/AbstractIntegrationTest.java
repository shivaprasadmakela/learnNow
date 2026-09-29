package com.learnnow;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
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

    /**
     * One container for the whole run, started here rather than by {@code @Container}.
     *
     * <p>{@code @Container} on a static field is per-class: JUnit stops the container when the
     * first test class finishes and starts a fresh one, on a new random port, for the next. Spring
     * does not follow, because every class here shares one configuration and therefore one cached
     * application context - so the second class onwards holds a DataSource pointed at a port
     * nothing is listening on, and every test fails with "Could not open JPA EntityManager for
     * transaction" after the connection timeout.
     *
     * <p>Nothing caught this while the suite had only one class able to reach Docker. It appeared
     * the moment a second one could.
     *
     * <p>Starting it once and never stopping it is the documented singleton pattern: Ryuk removes
     * the container when the JVM exits, so nothing is left behind. The Docker check keeps this
     * static initialiser from throwing on a machine without a daemon, where the annotation above is
     * about to skip these classes anyway.
     */
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("learnnow_test");

    static {
        if (DockerClientFactory.instance().isDockerAvailable()) {
            POSTGRES.start();
        }
    }
}
