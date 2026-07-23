package com.learnnow.paths.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "paths")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Path {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String category;
    
    private String managedBy;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;

    @OneToMany(mappedBy = "path", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Topic> topics = new ArrayList<>();
}
