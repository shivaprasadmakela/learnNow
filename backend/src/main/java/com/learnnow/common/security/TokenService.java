package com.learnnow.common.security;

import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/**
 * Issues access tokens.
 *
 * <p>These used to last seven days with no way to withdraw one, so a stolen token stayed usable for
 * a week. They are now short-lived and renewed through a revocable refresh token, which is what
 * makes sign-out and password reset able to actually end a session.
 */
@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final Duration accessTokenTtl;

    public TokenService(
            JwtEncoder jwtEncoder,
            @Value("${app.security.access-token-ttl-minutes:30}") long accessTokenTtlMinutes) {
        this.jwtEncoder = jwtEncoder;
        this.accessTokenTtl = Duration.ofMinutes(accessTokenTtlMinutes);
    }

    public String generateToken(String userId, String email, String role, int tokenVersion) {
        Instant now = Instant.now();
        JwsHeader headers = JwsHeader.with(MacAlgorithm.HS256).build();
        String userRole = role != null ? role.toUpperCase() : "USER";
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer("learnnow")
                        .issuedAt(now)
                        .expiresAt(now.plus(accessTokenTtl))
                        .subject(userId)
                        .claim("email", email)
                        .claim("role", userRole)
                        // Spring maps the "scope" claim to SCOPE_* authorities, which is what
                        // the /api/admin/** rule matches on.
                        .claim("scope", userRole)
                        .claim("tv", tokenVersion)
                        .build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(headers, claims)).getTokenValue();
    }

    public Duration getAccessTokenTtl() {
        return accessTokenTtl;
    }
}
