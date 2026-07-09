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
        if (pathRepository.count() == 0) {
            Path javaPath = Path.builder()
                    .title("Java Backend Path")
                    .description("Learn core Java programming, object-oriented design patterns, collections framework, multithreading, and Spring Boot enterprise APIs.")
                    .category("Backend")
                    .managedBy("Managed by Academy")
                    .build();

            Path reactPath = Path.builder()
                    .title("React Developer Foundations")
                    .description("Master modern frontend development using React.js, hooks, component architecture, global state management, and responsive styling systems.")
                    .category("Frontend")
                    .managedBy("Managed by Academy")
                    .build();

            Path htmlCssPath = Path.builder()
                    .title("HTML & CSS Styles & Layouts")
                    .description("Understand document models, styling standards, CSS variables, layouts (Flexbox/Grid), and absolute/relative alignments.")
                    .category("Frontend")
                    .managedBy("Managed by Academy")
                    .build();

            Path aiPath = Path.builder()
                    .title("AI for Nonprofits")
                    .description("Understand prompt engineering, artificial intelligence tools, LLM integrations, and process automations for social impact workflows.")
                    .category("AI / ML")
                    .managedBy("Managed by Google Cloud")
                    .build();

            Path agentsPath = Path.builder()
                    .title("GEAR Introduction to Agents and Google's Agent Ecosystem")
                    .description("Explore next-generation AI agents, cognitive frameworks, task orchestrations, and tooling architectures within the Cloud ecosystem.")
                    .category("Agents")
                    .managedBy("Managed by Google Cloud")
                    .build();

            Path leaderPath = Path.builder()
                    .title("Cloud Digital Leader Certification")
                    .description("Acquire foundational cloud literacy, standard infrastructure patterns, scaling structures, and storage migrations.")
                    .category("Infrastructure")
                    .managedBy("Managed by Google Cloud")
                    .build();

            pathRepository.saveAll(Arrays.asList(javaPath, reactPath, htmlCssPath, aiPath, agentsPath, leaderPath));
            System.out.println("Seeded database with initial paths (Java, React, HTML/CSS, AI, etc.)!");
        }
    }
}
