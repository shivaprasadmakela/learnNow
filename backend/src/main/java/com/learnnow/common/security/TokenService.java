package com.learnnow.common.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;

    public TokenService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateToken(String userId, String email, String role) {
        Instant now = Instant.now();
        JwsHeader headers = JwsHeader.with(MacAlgorithm.HS256).build();
        String userRole = role != null ? role.toUpperCase() : "USER";
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer("learnnow")
                        .issuedAt(now)
                        .expiresAt(now.plus(7, ChronoUnit.DAYS))
                        .subject(userId)
                        .claim("email", email)
                        .claim("role", userRole)
                        .claim("scope", userRole)
                        .build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(headers, claims)).getTokenValue();
    }
}
