package com.learnnow.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import com.learnnow.common.security.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final RateLimitingFilter rateLimitingFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public read-only catalog and path listing
                .requestMatchers(HttpMethod.GET, "/api/paths/**", "/api/catalog/**", "/api/health").permitAll()
                // Auth flows
                .requestMatchers("/api/auth/**", "/api/health", "/error").permitAll()
                // Donations (Buy Me a Coffee) - open to both guest & logged in users
                .requestMatchers("/api/donations/**").permitAll()
                // Compiler: execution is public (API key is server-side; abuse handled by IP rate limiting).
                // Creating shared snippets requires login so snippets are tied to a user identity.
                // Reading a shared snippet via short link is always public.
                .requestMatchers(HttpMethod.POST, "/api/compiler/snippets/execute").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/compiler/snippets/{shortId}").permitAll()

                // Admin endpoints require ADMIN role
                .requestMatchers("/api/admin/**").hasAnyAuthority("SCOPE_ADMIN", "ROLE_ADMIN", "ADMIN")
                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(Customizer.withDefaults())
            );

        return http.build();
    }

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    /**
     * Single source-of-truth CORS configuration.
     * Uses configurable allowed-origins property for production security.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        List<String> origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        cfg.setAllowedOriginPatterns(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        cfg.setAllowedHeaders(List.of("*"));
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
