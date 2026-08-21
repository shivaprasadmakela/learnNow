package com.learnnow.user.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id private String id;

    @Column(unique = true, nullable = false)
    private String email;

    private String firstName;
    private String lastName;
    private String fullName;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "google_sub", unique = true)
    private String googleSub;

    @Builder.Default private boolean emailVerified = false;

    private String avatar;

    @Builder.Default private String role = "USER";

    /**
     * Incremented to invalidate every access token issued to this user so far. Checked when a
     * refresh token is redeemed, which bounds the lifetime of a compromised access token to a
     * single access-token TTL without a database read on every request.
     */
    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private int tokenVersion = 0;

    private String bio;

    @Builder.Default private Instant createdAt = Instant.now();

    @Builder.Default private Instant updatedAt = Instant.now();
}
