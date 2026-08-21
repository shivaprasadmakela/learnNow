package com.learnnow.common.config;

import java.util.concurrent.Executor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Enables the background work this application needs: outbound email and token housekeeping.
 *
 * <p>Email in particular used to be sent synchronously inside the registration transaction, which
 * held a database connection open for the whole third-party round-trip. With a pool of ten, a slow
 * mail provider was enough to stall registration entirely.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {

    @Bean("taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("learnnow-async-");
        // Email is best-effort; if the queue is saturated the caller runs it rather than
        // silently dropping the message.
        executor.setRejectedExecutionHandler(
                new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
