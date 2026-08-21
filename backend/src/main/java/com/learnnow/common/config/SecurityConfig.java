package com.learnnow.common.config;

import com.learnnow.common.security.RateLimitingFilter;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final RateLimitingFilter rateLimitingFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Safe to disable: the API is stateless and authenticates from the
                // Authorization header, never from an ambient cookie. Re-enable this if
                // tokens ever move into cookies.
                .csrf(csrf -> csrf.disable())
                .headers(
                        headers ->
                                headers.frameOptions(frame -> frame.deny())
                                        .contentTypeOptions(Customizer.withDefaults())
                                        .httpStrictTransportSecurity(
                                                hsts ->
                                                        hsts.includeSubDomains(true)
                                                                .maxAgeInSeconds(31536000))
                                        .referrerPolicy(
                                                referrer ->
                                                        referrer.policy(
                                                                org.springframework.security.web
                                                                        .header.writers
                                                                        .ReferrerPolicyHeaderWriter
                                                                        .ReferrerPolicy
                                                                        .STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                                        .permissionsPolicy(
                                                permissions ->
                                                        permissions.policy(
                                                                "camera=(), microphone=(),"
                                                                        + " geolocation=(),"
                                                                        + " payment=()")))
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                                        .permitAll()
                                        // Public read-only catalog and path listing
                                        .requestMatchers(
                                                HttpMethod.GET,
                                                "/api/paths/**",
                                                "/api/catalog/**",
                                                "/api/health")
                                        .permitAll()
                                        // Auth flows
                                        .requestMatchers("/api/auth/**", "/api/health", "/error")
                                        .permitAll()
                                        // Donation checkout is open to guests; the webhook is
                                        // authenticated by its Razorpay signature, not by a JWT.
                                        .requestMatchers("/api/donations/**")
                                        .permitAll()
                                        // Reading a shared snippet by short link stays public so
                                        // links work for anyone.
                                        .requestMatchers(
                                                HttpMethod.GET, "/api/compiler/snippets/{shortId}")
                                        .permitAll()
                                        // Code execution now requires a login. It proxies to an
                                        // external execution engine, so leaving it anonymous made
                                        // the service an open execution relay with no way to
                                        // attribute or quota abuse.
                                        .requestMatchers("/api/compiler/**")
                                        .authenticated()
                                        // Admin endpoints require ADMIN role
                                        .requestMatchers("/api/admin/**")
                                        .hasAnyAuthority("SCOPE_ADMIN", "ROLE_ADMIN", "ADMIN")
                                        // Everything else requires a valid JWT
                                        .anyRequest()
                                        .authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }

    /**
     * Exact-origin CORS. Uses {@code setAllowedOrigins} rather than the pattern variant: patterns
     * exist to permit wildcards, and a wildcard combined with {@code allowCredentials} would let
     * any site read authenticated responses. {@code StartupConfigValidator} additionally refuses to
     * boot if a configured origin contains one.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        List<String> origins =
                Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();

        cfg.setAllowedOrigins(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        cfg.setAllowedHeaders(
                List.of(
                        HttpHeaders.AUTHORIZATION,
                        HttpHeaders.CONTENT_TYPE,
                        HttpHeaders.ACCEPT,
                        HttpHeaders.ACCEPT_LANGUAGE,
                        "X-Requested-With"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
