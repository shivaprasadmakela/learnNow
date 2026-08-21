package com.learnnow.common.api;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public liveness signal.
 *
 * <p>Unlike the previous version, this actually opens a database connection: reporting a hardcoded
 * {@code UP} meant a container with a dead connection pool kept receiving traffic. Orchestrator
 * probes should point at the Actuator endpoints on the management port instead; this exists for
 * uptime checks that only have access to the public port.
 */
@Slf4j
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @Value("${app.version:unknown}")
    private String version;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        boolean dbUp = isDatabaseReachable();

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", dbUp ? "UP" : "DOWN");
        status.put("service", "learnNow API");
        status.put("database", dbUp ? "UP" : "DOWN");
        status.put("timestamp", Instant.now().toString());
        status.put("version", version);

        return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .body(status);
    }

    private boolean isDatabaseReachable() {
        try (var connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            log.error("Health check could not reach the database", e);
            return false;
        }
    }
}
