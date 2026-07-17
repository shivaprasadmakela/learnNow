package com.learnnow.paths.config;

import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.repository.PathRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

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

        List<Subtopic> javaSubtopics = Arrays.asList(
                Subtopic.builder().title("Core Java Basics (The Foundation)").description("Master primitive types, flow control, arrays, and syntax basics. Set up your JDK development environment.").category("course").duration("2 hours").isCompleted(true).path(javaPath).build(),
                Subtopic.builder().title("Object-Oriented Programming (OOP)").description("Delve deep into classes, interfaces, inheritance, polymorphism, encapsulation, and abstraction.").category("course").duration("3 hours").isCompleted(false).path(javaPath).build(),
                Subtopic.builder().title("Java Collections Framework & Generics").description("Work with Lists, Sets, Maps, Queues, and define type-safe generic classes and methods.").category("course").duration("2 hours").isCompleted(false).path(javaPath).build(),
                Subtopic.builder().title("Modern Java & Advanced Features (Java 8 to 21)").description("Learn lambda expressions, streams, records, pattern matching, virtual threads, and new API features.").category("course").duration("4 hours").isCompleted(false).path(javaPath).build(),
                Subtopic.builder().title("Exceptions, File I/O, and Databases").description("Handle runtime errors, use input/output streams, read/write files, and integrate with JDBC databases.").category("course").duration("2.5 hours").isCompleted(false).path(javaPath).build(),
                Subtopic.builder().title("Concurrency & Multithreading (Advanced)").description("Understand thread creation, synchronization, volatile fields, lock frameworks, executors, and thread safety.").category("course").duration("3 hours").isCompleted(false).path(javaPath).build(),
                Subtopic.builder().title("JVM Internals & Memory Management (Deep Dive)").description("Explore garbage collection, classloaders, stack vs heap memory, and profiling application performance.").category("lab").duration("1.5 hours").isCompleted(false).path(javaPath).build(),
                Subtopic.builder().title("Reactive Programming & Spring WebFlux (Enterprise Level)").description("Build non-blocking, asynchronous reactive microservices using Project Reactor and WebFlux.").category("course").duration("4 hours").isCompleted(false).path(javaPath).build()
        );
        javaPath.setSubtopics(javaSubtopics);

        pathRepository.save(javaPath);
        System.out.println("Cleared database and seeded with Java Backend Path and subtopics!");
    }
}
