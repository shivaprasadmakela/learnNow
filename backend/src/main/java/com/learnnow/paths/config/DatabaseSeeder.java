package com.learnnow.paths.config;

import com.learnnow.paths.repository.PathRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Profile({"local", "dev-seed"})
@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final PathRepository pathRepository;

    public DatabaseSeeder(PathRepository pathRepository) {
        this.pathRepository = pathRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Database seeder disabled — courses are authored and published dynamically from Admin Studio.
    }
}
