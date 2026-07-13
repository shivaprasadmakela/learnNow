# Bugfix Academy Platform

Welcome to **Bugfix Academy**, an interactive code integration and learning platform designed to help developers practice coding challenges, master core concepts, and track course accomplishments.

This project is built using a feature-based architecture and consists of a React UI frontend and a Java Spring Boot backend.

---

## Repository Structure

The project is structured into two main subdirectories:

- **/backend**: Java Spring Boot backend running on Java 17+, handling course modules, lesson progression, database storage, and user profile management.
- **/ui**: React + TypeScript + Vite frontend utilizing CSS Modules, with global typography utilizing the Figtree font-family and a modern, responsive, collapsible left-navigation flow.

```
bugfix/
├── backend/                # Spring Boot REST API
│   ├── src/main/java/      # Feature-packaged controller, entities, and services
│   └── pom.xml             # Maven dependencies
├── ui/                     # React + TypeScript + Vite
│   ├── src/features/       # Feature-specific modules (learning, etc.)
│   ├── src/shared/         # Reusable widgets and icons
│   ├── src/styles/         # Global typography and theme configurations
│   └── package.json        # Frontend configuration
└── README.md               # Main instructions (this file)
```

---

## Getting Started

### Prerequisites
- Java Development Kit (JDK) 17 or higher
- Node.js (v18+) & npm
- Maven 3.6+

### Step 1: Run the Backend Server
Navigate to the backend directory and launch the Spring Boot application using Maven. The backend starts on port `8888` (or custom config, check properties) and exposes APIs on port `8081` (with CORS pre-flight configuration for the UI client).

```bash
cd backend
mvn spring-boot:run
```

The database seeds automatically with core learning tracks, course modules, and lessons.

### Step 2: Run the UI Development Client
Navigate to the UI directory, install packages, and boot the local Vite dev server.

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Contributing Guide

Please read [CONTRIBUTING.md](CONTRIBUTING.md) to understand our coding standards, branch conventions, and layout structures when introducing new modules or fixing bugs.

---

## References

- [Owl Stickers Pack Reference](https://www.flaticon.com/stickers-pack/owl-2)

