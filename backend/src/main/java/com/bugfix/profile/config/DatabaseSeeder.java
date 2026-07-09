package com.bugfix.profile.config;

import com.bugfix.profile.entity.Path;
import com.bugfix.profile.repository.PathRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final PathRepository pathRepository;

    public DatabaseSeeder(PathRepository pathRepository) {
        this.pathRepository = pathRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        pathRepository.deleteAll();
        
        Path javaPath = Path.builder()
                .title("Java Backend Path")
                .description("Learn core Java programming, object-oriented design patterns, collections framework, multithreading, and Spring Boot enterprise APIs.")
                .category("Backend")
                .managedBy("Managed by Academy")
                .build();

        pathRepository.save(javaPath);
        System.out.println("Cleared database and seeded with Java Backend Path only!");
    }
}
