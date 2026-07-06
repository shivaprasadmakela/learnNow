package com.bugfix.learning.config;

import com.bugfix.learning.entity.*;
import com.bugfix.learning.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final LessonRepository lessonRepository;
    private final QuizQuestionRepository quizQuestionRepository;

    public DatabaseSeeder(CourseRepository courseRepository,
                          CourseModuleRepository courseModuleRepository,
                          LessonRepository lessonRepository,
                          QuizQuestionRepository quizQuestionRepository) {
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.lessonRepository = lessonRepository;
        this.quizQuestionRepository = quizQuestionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Safe clean up of the old "Advanced Java Course" to ensure we re-seed it with the correct titles
        courseRepository.findAll().stream()
                .filter(c -> "Advanced Java Course".equals(c.getTitle()))
                .findFirst()
                .ifPresent(c -> {
                    courseModuleRepository.findAll().stream()
                            .filter(m -> m.getCourseId().equals(c.getId()))
                            .forEach(m -> {
                                lessonRepository.findAll().stream()
                                        .filter(l -> l.getModuleId().equals(m.getId()))
                                        .forEach(lessonRepository::delete);
                                courseModuleRepository.delete(m);
                            });
                    courseRepository.delete(c);
                });

        // Only seed if empty
        if (courseRepository.count() == 0) {
            seedCourses();
        } else {
            seedAdvancedJavaCourse();
        }
    }

    private void seedCourses() {
        // 1. Primary Fullstack Course
        Course fullstackCourse = new Course(
                null,
                "React & Spring Boot Fullstack Development",
                "Build modern, end-to-end web applications combining the reactive power of a React TypeScript frontend with the robust, enterprise-grade architecture of a Spring Boot backend.",
                "Fullstack",
                "12 Hours",
                "Beginner to Advanced",
                "fullstack_course"
        );
        Course savedCourse = courseRepository.save(fullstackCourse);
        Long courseId = savedCourse.getId();

        // --- MODULE 1 ---
        CourseModule module1 = courseModuleRepository.save(new CourseModule(null, courseId, "Introduction to Fullstack Architectures", 1));
        
        Lesson lesson1_1 = lessonRepository.save(new Lesson(
                null,
                module1.getId(),
                "Understanding the Client-Server Web Model",
                "### The Client-Server Model\n\n" +
                "At the core of modern web development is the **Client-Server Architecture**. In this layout, tasks are shared between providers of a resource or service (called **servers**) and service requesters (called **clients**).\n\n" +
                "Client-server applications communicate via the **Hypertext Transfer Protocol (HTTP)**. The client initiates a request, and the server processes it and sends back a response.\n\n" +
                "```\n" +
                "+------------------+      HTTP Request       +------------------+\n" +
                "|                  |  -------------------->  |                  |\n" +
                "|  React Client    |                         |  Spring Server   |\n" +
                "|  (Browser UI)    |  <--------------------  |  (REST API)      |\n" +
                "|                  |      HTTP Response      |                  |\n" +
                "+------------------+                         +------------------+\n" +
                "```\n\n" +
                "### Understanding RESTful API Design\n\n" +
                "**REST** (Representational State Transfer) is an architectural style for design APIs. RESTful services use standard HTTP methods to perform CRUD operations:\n\n" +
                "- **GET**: Retrieve resource details. Must be safe and idempotent (should not alter state).\n" +
                "- **POST**: Create a new resource on the server.\n" +
                "- **PUT**: Replace/Update an existing resource entirely. Must be idempotent.\n" +
                "- **DELETE**: Remove a resource from the server.\n\n" +
                "### Standard HTTP Status Codes\n\n" +
                "Servers use numeric status codes to communicate request outcomes:\n\n" +
                "- `200 OK`: Request succeeded.\n" +
                "- `201 Created`: Resource successfully created (common response for POST requests).\n" +
                "- `400 Bad Request`: Client request had syntax errors or bad data values.\n" +
                "- `404 Not Found`: Requested resource does not exist on the server.\n" +
                "- `500 Internal Server Error`: Server encountered a bug or database failure.",
                1,
                45
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson1_1.getId(),
                "Which HTTP method is designed to be idempotent and is typically used to update an existing resource entirely?",
                "POST;PUT;GET;DELETE",
                1,
                "PUT is idempotent, meaning multiple identical requests will have the same effect as a single request. It is typically used to update resources."
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson1_1.getId(),
                "What does REST stand for?",
                "Representation State Transfer;Representational State Transfer;Routing Entity Service Template;Request Response System",
                1,
                "REST stands for Representational State Transfer, coined by Roy Fielding in 2000."
        ));

        Lesson lesson1_2 = lessonRepository.save(new Lesson(
                null,
                module1.getId(),
                "Fullstack Developer Environment Setup",
                "### System Prerequisites\n\n" +
                "To build fullstack applications locally, you must install developer runtimes on your machine. Ensure the following are set up:\n\n" +
                "1. **Java Development Kit (JDK 21)**: The latest Long-Term Support (LTS) release of the Java Platform.\n" +
                "2. **Node.js (LTS version)**: The Javascript runtime needed to execute npm commands and bundle React UI assets.\n" +
                "3. **An IDE**: VS Code for frontends, and IntelliJ IDEA or Eclipse for Spring Boot backends.\n\n" +
                "### Creating a React TypeScript Frontend with Vite\n\n" +
                "Vite is a modern, light builder that starts servers extremely fast. Run the following command in terminal to bootstrap your UI project:\n\n" +
                "```bash\n" +
                "npm create vite@latest tms-ui -- --template react-ts\n" +
                "cd tms-ui\n" +
                "npm install\n" +
                "```\n\n" +
                "### Initializing a Spring Boot Backend\n\n" +
                "Spring Initializr (`start.spring.io`) makes it easy to generate the initial directory structure for Spring projects. Select the following dependencies:\n\n" +
                "- **Spring Web**: Builds REST endpoints using Spring MVC.\n" +
                "- **Spring Data JPA**: Automates SQL queries with Java Persistence API.\n" +
                "- **H2 Database**: Fast, in-memory database ideal for development and testing.",
                2,
                40
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson1_2.getId(),
                "Which tool is commonly used to create and serve React TypeScript bundles in modern development?",
                "Maven;Webpack;Vite;Spring Boot",
                2,
                "Vite is a fast build tool and development server that has largely replaced Webpack for modern frontend bundling."
        ));

        // --- MODULE 2 ---
        CourseModule module2 = courseModuleRepository.save(new CourseModule(null, courseId, "Frontend Engineering with React", 2));

        Lesson lesson2_1 = lessonRepository.save(new Lesson(
                null,
                module2.getId(),
                "React Functional Components & Hooks",
                "### Functional Components\n\n" +
                "In React, a component is a reusable JavaScript function that returns **JSX** (HTML-like markup). TypeScript enforces strict typing on component props:\n\n" +
                "```tsx\n" +
                "interface UserCardProps {\n" +
                "  name: string;\n" +
                "  role: string;\n" +
                "}\n\n" +
                "export const UserCard: React.FC<UserCardProps> = ({ name, role }) => {\n" +
                "  return (\n" +
                "    <div className=\"card\">\n" +
                "      <h3>{name}</h3>\n" +
                "      <p>{role}</p>\n" +
                "    </div>\n" +
                "  );\n" +
                "};\n" +
                "```\n\n" +
                "### React State & The `useState` Hook\n\n" +
                "State is a component's memory. The `useState` hook allows functional components to store and update dynamic data:\n\n" +
                "```tsx\n" +
                "import React, { useState } from 'react';\n\n" +
                "const Counter = () => {\n" +
                "  const [count, setCount] = useState<number>(0);\n" +
                "  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;\n" +
                "}\n" +
                "```\n\n" +
                "### Handling Side Effects with `useEffect`\n\n" +
                "Side effects include actions like database queries, fetching API data, or modifying browser DOM. Use `useEffect` to coordinate these:\n\n" +
                "```tsx\n" +
                "import React, { useState, useEffect } from 'react';\n\n" +
                "useEffect(() => {\n" +
                "  // Code runs after component mounts\n" +
                "  console.log('Component mounted!');\n" +
                "  return () => console.log('Component will unmount (cleanup)');\n" +
                "}, []); // Empty array indicates this effect runs only ONCE on mount\n" +
                "```",
                1,
                55
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson2_1.getId(),
                "Which hook should you use to handle operations like data fetching or DOM manipulation on component mounting?",
                "useState;useContext;useRef;useEffect",
                3,
                "The useEffect hook is designed to manage side effects that synchronize with external systems in React components."
        ));

        Lesson lesson2_2 = lessonRepository.save(new Lesson(
                null,
                module2.getId(),
                "Integrating Backend APIs with Fetch",
                "### Fetching Data from Spring Boot\n\n" +
                "React UIs typically communicate with Spring Boot rest controllers using `fetch` or library clients like Axios. Use `async/await` to handle asynchronous promises:\n\n" +
                "```typescript\n" +
                "const loadCourses = async () => {\n" +
                "  try {\n" +
                "    const response = await fetch('/api/courses');\n" +
                "    if (!response.ok) throw new Error('Network error');\n" +
                "    const data = await response.json();\n" +
                "    setCourses(data);\n" +
                "  } catch (error) {\n" +
                "    setError(error.message);\n" +
                "  }\n" +
                "};\n" +
                "```\n\n" +
                "### Vite Proxy Configurations\n\n" +
                "During development, React is served on `http://localhost:5173` while Spring runs on `http://localhost:8081`. Making direct requests causes Cross-Origin Resource Sharing (CORS) security errors.\n\n" +
                "To resolve this seamlessly in local dev, configure a proxy in `vite.config.ts`:\n\n" +
                "```typescript\n" +
                "export default defineConfig({\n" +
                "  server: {\n" +
                "    proxy: {\n" +
                "      '/api': {\n" +
                "        target: 'http://localhost:8081',\n" +
                "        changeOrigin: true,\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "})\n" +
                "```",
                2,
                50
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson2_2.getId(),
                "What is the core benefit of configuring a local server proxy in your Vite configurations?",
                "Encrypted database queries;Bypassing browser CORS policy blocks during local development;Faster CSS stylesheet downloads;Enabling dark theme support",
                1,
                "Vite's server proxy routes frontend api calls to the backend server port, avoiding CORS policy blocks in your local browser."
        ));

        // --- MODULE 3 ---
        CourseModule module3 = courseModuleRepository.save(new CourseModule(null, courseId, "Backend Engineering with Spring Boot", 3));

        Lesson lesson3_1 = lessonRepository.save(new Lesson(
                null,
                module3.getId(),
                "Building RESTful Controllers in Java",
                "### Spring MVC & REST Controllers\n\n" +
                "Spring Boot uses annotations to scan classes and set up web routing endpoints automatically. A REST Controller is created by annotating a Java class with `@RestController`:\n\n" +
                "```java\n" +
                "package com.bugfix.learning.controller;\n\n" +
                "import org.springframework.web.bind.annotation.*;\n" +
                "import java.util.List;\n\n" +
                "@RestController\n" +
                "@RequestMapping(\"/api/hello\")\n" +
                "public class HelloController {\n\n" +
                "    @GetMapping\n" +
                "    public String sayHello() {\n" +
                "        return \"Hello from Spring Boot!\";\n" +
                "    }\n" +
                "}\n" +
                "```\n\n" +
                "### Accessing Request Variables\n\n" +
                "Use Spring annotations to capture parameters sent by clients:\n\n" +
                "1. **`@PathVariable`**: Captures path segments, e.g. `/api/courses/{id}`.\n" +
                "2. **`@RequestParam`**: Captures query parameters, e.g. `/api/search?query=react`.\n" +
                "3. **`@RequestBody`**: Binds incoming JSON payloads directly to Java object schemas (DTOs).",
                1,
                60
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson3_1.getId(),
                "Which Spring Boot annotation designates a Java class as a controller that automatically serializes response bodies to JSON?",
                "@Controller;@Service;@RestController;@Component",
                2,
                "@RestController combines @Controller and @ResponseBody, serializing return values directly into HTTP response bodies."
        ));

        Lesson lesson3_2 = lessonRepository.save(new Lesson(
                null,
                module3.getId(),
                "Database Persistence with Spring Data JPA",
                "### Java Persistence API (JPA)\n\n" +
                "JPA is a Java standard mapping objects (entities) to SQL database tables. Mark a model as persistent using `@Entity` and `@Table`:\n\n" +
                "```java\n" +
                "import jakarta.persistence.*;\n\n" +
                "@Entity\n" +
                "@Table(name = \"users\")\n" +
                "public class User {\n" +
                "    @Id\n" +
                "    @GeneratedValue(strategy = GenerationType.IDENTITY)\n" +
                "    private Long id;\n" +
                "    private String name;\n" +
                "    // constructors, getters, setters\n" +
                "}\n" +
                "```\n\n" +
                "### Spring Data JPA Repositories\n\n" +
                "Extend `JpaRepository<Entity, IdType>` to get database operation helpers like `save()`, `findById()`, `findAll()`, and `deleteById()` automatically compiled at runtime:\n\n" +
                "```java\n" +
                "import org.springframework.data.jpa.repository.JpaRepository;\n" +
                "import org.springframework.stereotype.Repository;\n\n" +
                "@Repository\n" +
                "public interface UserRepository extends JpaRepository<User, Long> {\n" +
                "    // Spring automatically implements database fetching queries here!\n" +
                "}\n" +
                "```",
                2,
                55
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson3_2.getId(),
                "What interface can you extend in your repositories to get standard CRUD operations automatically?",
                "CrudService;JpaRepository;EntityRepository;JdbcTemplate",
                1,
                "JpaRepository provides full CRUD and pagination methods automatically at runtime based on generic type parameters."
        ));

        // --- MODULE 4 ---
        CourseModule module4 = courseModuleRepository.save(new CourseModule(null, courseId, "Connecting & Deploying the System", 4));

        Lesson lesson4_1 = lessonRepository.save(new Lesson(
                null,
                module4.getId(),
                "Configuring Cross-Origin Resource Sharing (CORS)",
                "### What is CORS?\n\n" +
                "**Cross-Origin Resource Sharing (CORS)** is a security feature built into browsers that blocks scripts hosted on one domain from querying resources on another domain.\n\n" +
                "For example, a script loaded from `http://localhost:5173` (React dev server) is blocked from calling APIs on `http://localhost:8081` (Spring Boot server) unless the backend explicitly approves it.\n\n" +
                "### Configuring CORS globally in Spring Boot\n\n" +
                "We can configure CORS by registering a global web configurator bean:\n\n" +
                "```java\n" +
                "import org.springframework.context.annotation.Configuration;\n" +
                "import org.springframework.web.servlet.config.annotation.CorsRegistry;\n" +
                "import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;\n\n" +
                "@Configuration\n" +
                "public class WebConfig implements WebMvcConfigurer {\n" +
                "    @Override\n" +
                "    public void addCorsMappings(CorsRegistry registry) {\n" +
                "        registry.addMapping(\"/**\")\n" +
                "                .allowedOrigins(\"http://localhost:5173\")\n" +
                "                .allowedMethods(\"GET\", \"POST\", \"PUT\", \"DELETE\");\n" +
                "    }\n" +
                "}\n" +
                "```",
                1,
                45
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson4_1.getId(),
                "Which mechanism enforces origin permissions on HTTP calls inside modern web browsers?",
                "CORS;XSS;CSRF;SQL Injection",
                0,
                "CORS is a security standard implemented by browsers to restrict cross-origin HTTP requests unless explicitly allowed by the server headers."
        ));

        Lesson lesson4_2 = lessonRepository.save(new Lesson(
                null,
                module4.getId(),
                "Packaging the Application for Deployment",
                "### Building production frontend bundles\n\n" +
                "To prepare our React app for deployment, build a static distribution package containing minimized HTML, CSS, and JS:\n\n" +
                "```bash\n" +
                "npm run build\n" +
                "```\n\n" +
                "This outputs all compile files to the `/dist` directory.\n\n" +
                "### Hosting Frontend Assets inside Spring Boot\n\n" +
                "Spring Boot automatically serves static contents from resources static folder on the classpath. Copy your `/dist` files into `src/main/resources/static` in the backend.\n\n" +
                "When you run Spring Boot, it will serve the React single-page UI at the root path `http://localhost:8081/`!\n\n" +
                "### Compiling the Spring Boot Executable JAR\n\n" +
                "Use Maven to compile the Java code and package it together with static files into a single, executable JAR file:\n\n" +
                "```bash\n" +
                "mvn clean package\n" +
                "```\n\n" +
                "This creates a file like `target/backend-0.0.1-SNAPSHOT.jar`. Launch it anywhere with Java installed:\n\n" +
                "```bash\n" +
                "java -jar target/backend-0.0.1-SNAPSHOT.jar\n" +
                "```",
                2,
                50
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson4_2.getId(),
                "Where should you copy compiled static web assets so Spring Boot serves them automatically?",
                "src/main/java;src/main/resources/static;src/main/resources/templates;target",
                1,
                "Spring Boot automatically serves static contents placed in /static, /public, or /resources directories on classpath."
        ));

        // 2. Placeholder Cloud Course
        courseRepository.save(new Course(
                null,
                "Google Cloud Console Basics",
                "Start your cloud journey by learning project administration, service management, compute virtual machines, cloud storage buckets, and IAM policy frameworks directly in Google Cloud Console.",
                "Cloud",
                "6 Hours",
                "Beginner",
                "cloud_course"
        ));

        // 3. Placeholder Boot Course
        courseRepository.save(new Course(
                null,
                "Advanced Spring Boot Architectures",
                "Take your Java skills to the enterprise level. Master transaction configurations, Spring Security OAuth2 OAuth protocols, reactive WebFlux APIs, messaging queues, and dockerized microservices.",
                "Backend",
                "15 Hours",
                "Advanced",
                "boot_course"
        ));

        // 4. Placeholder Design Course
        courseRepository.save(new Course(
                null,
                "UX/UI Design for Developers",
                "Design interfaces that users love. Learn core layout theory, styling variables, typography pairing, dark/light theme designs, and interactive high-fidelity prototyping with Figma.",
                "Design",
                "8 Hours",
                "Intermediate",
                "design_course"
        ));

        // 5. Advanced Java Course
        seedAdvancedJavaCourse();
    }

    private void seedAdvancedJavaCourse() {
        Course javaCourse = courseRepository.save(new Course(
                null,
                "Advanced Java Course",
                "Master Java from core architecture and modern enhancements to advanced concurrency, JVM internals, and reactive programming.",
                "Backend",
                "20 Hours",
                "Advanced",
                "java_course"
        ));
        Long javaId = javaCourse.getId();

        // --- LEVEL 1 ---
        CourseModule level1 = courseModuleRepository.save(new CourseModule(null, javaId, "Core Java Basics (The Foundation)", 1));
        
        Lesson lesson1_1 = lessonRepository.save(new Lesson(
                null,
                level1.getId(),
                "Java Architecture: JDK vs. JRE vs. JVM",
                "### Java Architecture: JDK vs. JRE vs. JVM (Complete Explanation)\n\n" +
                "Excellent starting point. JDK vs JRE vs JVM is one of the most frequently asked Java interview topics because it tests whether you understand how Java actually runs. Since your goal is to become a strong Java Backend Engineer, I'll explain it from an interview and production perspective.\n\n" +
                "When you write this program:\n\n" +
                "```java\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"Hello World\");\n" +
                "    }\n" +
                "}\n" +
                "```\n\n" +
                "A common beginner question is: How does this code actually execute?\n\n" +
                "The answer involves three major components: **JDK**, **JRE**, and **JVM**. Think of them as nested layers:\n\n" +
                "```\n" +
                "Developer -> JDK (Development Kit) -> JRE (Runtime Environment) -> JVM (Virtual Machine) -> OS -> Hardware\n" +
                "```\n\n" +
                "### Why Does Java Need These Components?\n\n" +
                "Java follows the principle: **Write Once, Run Anywhere (WORA)**. Unlike C/C++, Java doesn't compile directly into native machine code. Instead:\n\n" +
                "```\n" +
                "Java Source Code (.java) -> javac -> Bytecode (.class) -> JVM -> Native Machine Code\n" +
                "```\n\n" +
                "Every operating system has its own JVM. The bytecode never changes; only the JVM changes. This makes the bytecode platform-independent, while the JVM is platform-dependent.\n\n" +
                "### 1. What is JDK?\n\n" +
                "**JDK (Java Development Kit)** is the complete toolkit required to develop Java applications. It contains JRE + development tools like `javac` (compiler), `jdb` (debugger), `jar` (packager), and diagnostics tools like `jstack` and `jmap`.\n\n" +
                "### 2. What is JRE?\n\n" +
                "**JRE (Java Runtime Environment)** provides everything required to run a Java application. It includes the JVM, core Java libraries (like `java.lang`, `java.util`), and other support files. JRE does **not** contain development tools like `javac`.\n\n" +
                "### 3. What is JVM?\n\n" +
                "**JVM (Java Virtual Machine)** is the engine that executes Java bytecode, translating it to native machine instructions. It is responsible for loading classes, verifying bytecode, executing instructions, and performing Garbage Collection (GC) automatically.\n\n" +
                "## ## Key Takeaways\n\n" +
                "### Summary of JDK vs JRE vs JVM\n\n" +
                "| Component | Full Form | Purpose | Contains |\n" +
                "| :--- | :--- | :--- | :--- |\n" +
                "| **JDK** | Java Development Kit | Develop, compile, package, debug, and run Java apps | JRE + compiler (javac) + dev tools |\n" +
                "| **JRE** | Java Runtime Environment | Run Java applications | JVM + core Java libraries + runtime configs |\n" +
                "| **JVM** | Java Virtual Machine | Execute Java bytecode | Class Loader, Verifier, Interpreter, JIT, GC |\n\n" +
                "### Core Relationship\n\n" +
                "```\n" +
                "JDK\n" +
                "└── JRE\n" +
                "    └── JVM\n" +
                "```\n" +
                "Bytecode is fully portable, while the JVM itself is platform-dependent to act as a bridge between portable bytecode and the target OS.",
                1,
                30
        ));

        quizQuestionRepository.save(new QuizQuestion(
                null,
                lesson1_1.getId(),
                "Which component of the Java platform is platform-dependent and acts as the execution engine for bytecode?",
                "JDK;JRE;JVM;Bytecode Compiler",
                2,
                "The JVM translates bytecode into native OS instructions, making the JVM implementation OS-dependent."
        ));

        // Seed Level 1 Placeholder Lessons
        lessonRepository.save(new Lesson(null, level1.getId(), "Datatypes & Variables: Primitive vs. Reference", "### Datatypes & Variables\n\nLearn the differences between primitive types (int, double, char) and reference types (objects, arrays) in Java.", 2, 20));
        lessonRepository.save(new Lesson(null, level1.getId(), "Operators: Arithmetic, Logical, Bitwise, Ternary", "### Operators\n\nMaster standard operators and bitwise manipulations in Java.", 3, 15));
        lessonRepository.save(new Lesson(null, level1.getId(), "Control Flow: Modern Switch & Loops", "### Control Flow\n\nUnderstand flow control using loops and the new modern switch expressions.", 4, 25));
        lessonRepository.save(new Lesson(null, level1.getId(), "Arrays: Single & Multi-dimensional", "### Arrays in Java\n\nWork with contiguous memory structures in single and multi-dimensional shapes.", 5, 20));
        lessonRepository.save(new Lesson(null, level1.getId(), "String Manipulation: Pool, Builder, Buffer", "### String Manipulation\n\nDeep dive into Java's String Pool, immutability, and thread safety of StringBuilder vs StringBuffer.", 6, 25));

        // --- LEVEL 2 ---
        CourseModule level2 = courseModuleRepository.save(new CourseModule(null, javaId, "Object-Oriented Programming (OOP)", 2));
        lessonRepository.save(new Lesson(null, level2.getId(), "Classes and Objects: Constructors & Lifecycle", "### Classes & Objects\n\nConstructors, keyword 'this', and the lifecycle of objects.", 1, 20));
        lessonRepository.save(new Lesson(null, level2.getId(), "The 4 Pillars of OOP", "### 4 Pillars of OOP\n\nDeep dive into Inheritance, Polymorphism, Encapsulation, and Abstraction.", 2, 30));
        lessonRepository.save(new Lesson(null, level2.getId(), "Relationships: Association, Aggregation & Composition", "### Object Relationships\n\nUnderstand how objects connect in real systems.", 3, 20));
        lessonRepository.save(new Lesson(null, level2.getId(), "Special Classes: Nested, Inner, Anonymous, Interfaces", "### Special Classes\n\nNested classes, static structures, and default interface methods.", 4, 25));

        // --- LEVEL 3 ---
        CourseModule level3 = courseModuleRepository.save(new CourseModule(null, javaId, "Java Collections Framework & Generics", 3));
        lessonRepository.save(new Lesson(null, level3.getId(), "Generics: Wildcards & Type Erasure", "### Generics\n\nImplement compile-time type-safety using Generics.", 1, 25));
        lessonRepository.save(new Lesson(null, level3.getId(), "The Collection Hierarchy: Lists, Sets & Queues", "### Collections\n\nArrayList vs LinkedList, Set hashing logic, and Queues.", 2, 30));
        lessonRepository.save(new Lesson(null, level3.getId(), "Map Interface: HashMap internals & Concurrency", "### Maps\n\nHashMap bucket collision handling and ConcurrentHashMap.", 3, 30));
        lessonRepository.save(new Lesson(null, level3.getId(), "Utility Classes: Collections and Arrays", "### Utilities\n\nSort, search, and copy utilities.", 4, 15));

        // --- LEVEL 4 ---
        CourseModule level4 = courseModuleRepository.save(new CourseModule(null, javaId, "Modern Java & Advanced Features (Java 8 to 21)", 4));
        lessonRepository.save(new Lesson(null, level4.getId(), "Lambda Expressions & Functional Interfaces", "### Lambda Expressions\n\nFunctional interfaces like Predicate, Consumer, and Supplier.", 1, 20));
        lessonRepository.save(new Lesson(null, level4.getId(), "Streams API: Intermediate & Terminal Operations", "### Streams API\n\nDeclarative data processing with map, filter, flatMap, and reduce.", 2, 30));
        lessonRepository.save(new Lesson(null, level4.getId(), "Optional Class, Records, and Sealed Classes", "### Java 14+ Features\n\nBoilerplate-free DTOs (Records) and Sealed classes.", 3, 25));
        lessonRepository.save(new Lesson(null, level4.getId(), "Pattern Matching for switch and instanceof", "### Pattern Matching\n\nClean type checking and switch patterns.", 4, 20));

        // --- LEVEL 5 ---
        CourseModule level5 = courseModuleRepository.save(new CourseModule(null, javaId, "Exceptions, File I/O, and Databases", 5));
        lessonRepository.save(new Lesson(null, level5.getId(), "Exception Handling & Try-with-resources", "### Exception Handling\n\nChecked vs Unchecked exceptions and resource close checks.", 1, 25));
        lessonRepository.save(new Lesson(null, level5.getId(), "Java I/O vs. NIO Buffer-Oriented Files", "### File Systems\n\nNon-blocking I/O and standard streams.", 2, 25));
        lessonRepository.save(new Lesson(null, level5.getId(), "Database Access (JDBC) and Connection Pooling", "### JDBC\n\nEstablish SQL connections and optimize with pools.", 3, 20));

        // --- LEVEL 6 ---
        CourseModule level6 = courseModuleRepository.save(new CourseModule(null, javaId, "Concurrency & Multithreading (Advanced)", 6));
        lessonRepository.save(new Lesson(null, level6.getId(), "Basics of Threads & Lifecycle States", "### Threading Basics\n\nRunnable interface, Thread class, and thread states.", 1, 25));
        lessonRepository.save(new Lesson(null, level6.getId(), "Synchronization, Locks, and Volatile Keyword", "### Synchronizations\n\nDeadlocks, ReentrantLocks, and memory visibility.", 2, 30));
        lessonRepository.save(new Lesson(null, level6.getId(), "CompletableFuture & Asynchronous Pipelines", "### CompletableFuture\n\nAsync tasks chaining and error handling.", 3, 30));
        lessonRepository.save(new Lesson(null, level6.getId(), "Virtual Threads (Java 21 / Project Loom)", "### Virtual Threads\n\nLightweight threads for high-throughput reactive concurrency.", 4, 30));

        // --- LEVEL 7 ---
        CourseModule level7 = courseModuleRepository.save(new CourseModule(null, javaId, "JVM Internals & Memory Management (Deep Dive)", 7));
        lessonRepository.save(new Lesson(null, level7.getId(), "JVM Memory Structure: Heap, Stack & Metaspace", "### JVM Memory\n\nYoung vs Old generation, thread stack, and Metaspace.", 1, 25));
        lessonRepository.save(new Lesson(null, level7.getId(), "Garbage Collection (GC) and Collectors", "### Garbage Collection\n\nReachability analysis, G1GC, and low-latency ZGC.", 2, 30));
        lessonRepository.save(new Lesson(null, level7.getId(), "JVM Performance Tuning & Diagnosing Diagnostics", "### JVM Tuning\n\nXms/Xmx arguments, heap dumps, and thread dump inspection.", 3, 25));

        // --- LEVEL 8 ---
        CourseModule level8 = courseModuleRepository.save(new CourseModule(null, javaId, "Reactive Programming & Spring WebFlux (Enterprise Level)", 8));
        lessonRepository.save(new Lesson(null, level8.getId(), "Reactive Streams Specification", "### Reactive Streams\n\nPublisher, Subscriber, and Subscription contract flows.", 1, 20));
        lessonRepository.save(new Lesson(null, level8.getId(), "Project Reactor: Mono, Flux & Schedulers", "### Reactor Operators\n\nflatMap, zip, backpressure, and elastic threading models.", 2, 30));
        lessonRepository.save(new Lesson(null, level8.getId(), "WebFlux & R2DBC REST APIs", "### WebFlux\n\nNon-blocking web endpoints and reactive SQL adapters.", 3, 25));
    }
}

