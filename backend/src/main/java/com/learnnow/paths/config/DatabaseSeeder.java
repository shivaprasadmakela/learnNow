package com.learnnow.paths.config;

import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.repository.PathRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

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

        Topic foundationTopic = Topic.builder()
                .title("Core Java Basics (The Foundation)")
                .description("Master primitive types, flow control, arrays, and syntax basics. Set up your JDK development environment.")
                .category("Topic")
                .duration("2 hours")
                .isCompleted(true)
                .path(javaPath)
                .build();

        // Seed rich reading content sections under Foundation Subtopic
        Subtopic introSection = Subtopic.builder()
                .title("1. What is a String?")
                .orderIndex(1)
                .topic(foundationTopic)
                .content("""
## Definition
A **String** is an object in Java that represents a sequence of characters.

Example:
```java
String name = "Shiva";
```
Although it looks like a primitive type, it is actually an object of the `String` class.
```java
String name = new String("Shiva");
```
Both create `String` objects (with some important differences that we'll discuss).

---

## Why was String designed?
Strings are used everywhere:
* URLs
* SQL Queries
* JSON
* XML
* HTTP Headers
* Usernames
* Passwords
* File Names
* Spring Bean Names
* Cache Keys

Because strings are used so frequently, Java optimized them heavily.
This led to:
* String Pool
* Immutability
* HashCode caching
* Thread safety
* Security improvements
""")
                .build();

        Subtopic immutabilitySection = Subtopic.builder()
                .title("2. What is String Immutability?")
                .orderIndex(2)
                .topic(foundationTopic)
                .content("""
## Definition
An immutable object **cannot be modified after it is created**.

Example:
```java
String name = "Java";
name.concat(" Programming");
System.out.println(name);
```

Output:
```
Java
```
Many beginners expect `Java Programming`, but `concat()` returns a **new String**.

### Correct Example:
```java
String name = "Java";
name = name.concat(" Programming");
System.out.println(name);
```

Output:
```
Java Programming
```

---

## Why is String Immutable?
1. **Security**: Sensitive parameters like database URLs (`jdbc:mysql://localhost:3306`) or connection handles cannot be modified by other threads.
2. **String Pool**: Multiple references can point to the same object safely. If mutable, changing one reference would affect other users.
3. **Thread Safety**: Sharing string references across threads requires no synchronization.
4. **HashMap Optimization**: Cache keys or map keys remain consistent since their hashCode never changes.
5. **HashCode Caching**: Computed once and cached internally for O(1) retrieval.
""")
                .build();

        Subtopic poolSection = Subtopic.builder()
                .title("3. String Constant Pool")
                .orderIndex(3)
                .topic(foundationTopic)
                .content("""
## Definition
The **String Pool** is a special memory area inside the Heap that stores unique string literals. Instead of creating duplicate string objects, Java reuses existing ones.

## Why String Pool Exists
Imagine:
```java
String s1 = "Java";
String s2 = "Java";
String s3 = "Java";
```
Instead of allocating 3 separate strings in the heap, only one pooled object is created, and all three references point to it. This leads to huge memory savings.

## String Literal vs new String()
### Case 1: Literals
```java
String s1 = "Java";
String s2 = "Java";
System.out.println(s1 == s2); // true
```
Points to the same pooled instance.

### Case 2: new String()
```java
String s1 = new String("Java");
String s2 = new String("Java");
System.out.println(s1 == s2); // false
```
Creates two separate objects on the heap.

## intern() Method
Invoking `s1.intern()` returns the canonical representation from the string pool:
```java
String s1 = new String("Java");
String s2 = s1.intern();
String s3 = "Java";
System.out.println(s2 == s3); // true
```
""")
                .build();

        Subtopic compareSection = Subtopic.builder()
                .title("4. equals() vs ==")
                .orderIndex(4)
                .topic(foundationTopic)
                .content("""
## Comparison Operators
It is a very common interview question.

- `==` compares **references** (memory locations).
- `equals()` compares the actual **contents** (values).

### Example:
```java
String s1 = "Java";
String s2 = "Java";
System.out.println(s1 == s2); // true
```

```java
String s1 = new String("Java");
String s2 = new String("Java");
System.out.println(s1 == s2);      // false
System.out.println(s1.equals(s2)); // true
```
""")
                .build();

        Subtopic buildersSection = Subtopic.builder()
                .title("5. StringBuilder & StringBuffer")
                .orderIndex(5)
                .topic(foundationTopic)
                .content("""
## StringBuilder
`StringBuilder` is a **mutable** sequence of characters. It modifies the same object instead of creating new ones.

### Example:
```java
StringBuilder builder = new StringBuilder("Java");
builder.append(" Programming");
System.out.println(builder); // Java Programming
```
It maintains an internal array of characters. It has a default capacity of `16`. When exceeded, it grows using the formula: `(oldCapacity * 2) + 2`.

---

## StringBuffer
`StringBuffer` is also mutable, but its methods are **synchronized**, making it thread-safe.

### Example:
```java
StringBuffer buffer = new StringBuffer("Java");
buffer.append(" Backend");
System.out.println(buffer); // Java Backend
```

### Why StringBuilder is preferred:
Because `StringBuilder` has no synchronization overhead, it is much faster than `StringBuffer`. Use `StringBuilder` in single-threaded contexts and `StringBuffer` only when multiple threads must modify the same buffer.
""")
                .build();

        Subtopic perfSection = Subtopic.builder()
                .title("6. Performance & Compilation")
                .orderIndex(6)
                .topic(foundationTopic)
                .content("""
## Performance Comparison
Repeated string concatenation inside loops should always use `StringBuilder`.

### Bad (Creates thousands of garbage objects, O(n²)):
```java
String result = "";
for (int i = 0; i < 10000; i++) {
    result += i;
}
```

### Good (Updates the same buffer, O(n)):
```java
StringBuilder builder = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    builder.append(i);
}
String result = builder.toString();
```

---

## Behind the Scenes: `+` Operator
At compile time, standard literal concatenation is folded:
```java
String s = "Hello " + "Java"; // Compiled as "Hello Java"
```
For dynamic variable concatenation:
```java
String name = "Shiva";
String message = "Hello " + name;
```
The compiler automatically translates this to use a `StringBuilder` under the hood.
""")
                .build();

        Subtopic questionsSection = Subtopic.builder()
                .title("7. Mistakes & Interview Q&A")
                .orderIndex(7)
                .topic(foundationTopic)
                .content("""
## Common Mistakes
1. Using `==` instead of `.equals()` to compare contents.
2. Concatenating strings in a loop instead of using `StringBuilder`.
3. Assuming `.concat()` mutates the original string (it returns a new one!).
4. Using `new String("text")` instead of `"text"`.

---

## Top Interview Questions
1. **Why is String immutable?**
   *Security, thread safety, string pool sharing, cached hashCode, and collection key consistency.*
2. **StringBuilder vs StringBuffer?**
   *Both are mutable. StringBuilder is unsynchronized (faster), StringBuffer is synchronized (thread-safe).*
3. **Where is String Pool stored?**
   *Stored in the regular Heap space since Java 7 (was PermGen in older versions).*
""")
                .build();

        foundationTopic.setSubtopics(Arrays.asList(
                introSection, immutabilitySection, poolSection, compareSection, buildersSection, perfSection, questionsSection
        ));

        // Create other subtopics
        Topic oopTopic = Topic.builder().title("Object-Oriented Programming (OOP)").description("Delve deep into classes, interfaces, inheritance, polymorphism, encapsulation, and abstraction.").category("Topic").duration("3 hours").isCompleted(false).path(javaPath).build();
        Topic collTopic = Topic.builder().title("Java Collections Framework & Generics").description("Work with Lists, Sets, Maps, Queues, and define type-safe generic classes and methods.").category("Topic").duration("2 hours").isCompleted(false).path(javaPath).build();
        Topic modernTopic = Topic.builder().title("Modern Java & Advanced Features (Java 8 to 21)").description("Learn lambda expressions, streams, records, pattern matching, virtual threads, and new API features.").category("Topic").duration("4 hours").isCompleted(false).path(javaPath).build();
        Topic exceptionsTopic = Topic.builder().title("Exceptions, File I/O, and Databases").description("Handle runtime errors, use input/output streams, read/write files, and integrate with JDBC databases.").category("Topic").duration("2.5 hours").isCompleted(false).path(javaPath).build();
        Topic concurrencyTopic = Topic.builder().title("Concurrency & Multithreading (Advanced)").description("Understand thread creation, synchronization, volatile fields, lock frameworks, executors, and thread safety.").category("Topic").duration("3 hours").isCompleted(false).path(javaPath).build();
        Topic jvmTopic = Topic.builder().title("JVM Internals & Memory Management (Deep Dive)").description("Explore garbage collection, classloaders, stack vs heap memory, and profiling application performance.").category("Console").duration("1.5 hours").isCompleted(false).path(javaPath).build();
        Topic reactiveTopic = Topic.builder().title("Reactive Programming & Spring WebFlux (Enterprise Level)").description("Build non-blocking, asynchronous reactive microservices using Project Reactor and WebFlux.").category("Topic").duration("4 hours").isCompleted(false).path(javaPath).build();

        List<Topic> javaTopics = new ArrayList<>(Arrays.asList(
                foundationTopic, oopTopic, collTopic, modernTopic, exceptionsTopic, concurrencyTopic, jvmTopic, reactiveTopic
        ));
        javaPath.setTopics(javaTopics);

        pathRepository.save(javaPath);
        System.out.println("Cleared database and seeded with Java Backend Path and subtopics!");
    }
}
