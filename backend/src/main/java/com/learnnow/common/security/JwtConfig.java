package com.learnnow.common.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
public class JwtConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Charset is explicit. {@code String.getBytes()} without one derives the key from the JVM's
     * default encoding, so the same secret could produce different keys on a developer machine and
     * in a container - tokens signed in one place would then fail to verify in the other. {@code
     * StartupConfigValidator} enforces the 256-bit minimum HS256 requires.
     */
    private byte[] secretBytes() {
        return jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        SecretKeySpec spec = new SecretKeySpec(secretBytes(), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(spec).build();
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        JWKSource<SecurityContext> jwks = new ImmutableSecret<>(secretBytes());
        return new NimbusJwtEncoder(jwks);
    }
}
