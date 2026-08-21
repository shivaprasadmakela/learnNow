package com.learnnow.common.config;

import java.time.Duration;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Outbound HTTP clients with explicit timeouts.
 *
 * <p>Every outbound call previously used {@code RestClient.create()}, which has no connect or read
 * timeout at all. A slow third party could therefore pin a Tomcat worker thread indefinitely;
 * enough of them and the whole service stops answering, including endpoints unrelated to the slow
 * dependency. Timeouts are the difference between a degraded feature and an outage.
 */
@Configuration
public class HttpClientConfig {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    /** Code execution is synchronous upstream, so it needs the longest ceiling. */
    private static final Duration EXECUTION_READ_TIMEOUT = Duration.ofSeconds(20);

    private static final Duration DEFAULT_READ_TIMEOUT = Duration.ofSeconds(10);

    @Bean
    public RestClientCustomizer restClientTimeoutCustomizer() {
        return builder -> builder.requestFactory(requestFactory(DEFAULT_READ_TIMEOUT));
    }

    /** Dedicated client for the code execution engine. */
    @Bean("codeExecutionRestClient")
    public RestClient codeExecutionRestClient(
            @org.springframework.beans.factory.annotation.Value(
                            "${app.compiler.base-url:https://ce.judge0.com}")
                    String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory(EXECUTION_READ_TIMEOUT))
                .build();
    }

    private ClientHttpRequestFactory requestFactory(Duration readTimeout) {
        return ClientHttpRequestFactories.get(
                ClientHttpRequestFactorySettings.DEFAULTS
                        .withConnectTimeout(CONNECT_TIMEOUT)
                        .withReadTimeout(readTimeout));
    }
}
