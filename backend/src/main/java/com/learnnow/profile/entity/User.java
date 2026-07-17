package com.learnnow.profile.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Column(unique = true)
    private String email;

    private String fullName;
    
    private String avatar;
    
    private String role;
    
    private String bio;
}
