# learnNow Platform

Welcome to the interactive learning and code integration platform. This repository is built using a feature-based architecture consisting of a **React + Vite** frontend and a **Java Spring Boot** backend.

---

## 🏗️ Tech Stack & Architecture

### Backend
*   **Java Spring Boot**: Exposes REST APIs on port `8080`.
*   **Database & Migrations**: PostgreSQL database named `learnnow` with schema versioning managed via **Flyway**.
*   **Security & JWT Auth**: Custom JWT authentication signed with a symmetric HMAC-SHA256 signature key. Passwords are hashed using BCrypt.
*   **Email Verification**: Integrated with **Resend** (prints email verification links directly to local server logs in development for sandboxed testing).
*   **Package Structure**: Organised around clean domains (e.g. `com.learnnow.user` for user profiles and `com.learnnow.paths` for course pathways).

### Frontend
*   **React + TypeScript + Vite**: Development client running on `http://localhost:5173/`.
*   **CSS Modules**: Modular, scope-safe styling.
*   **Route Security**: Public paths list (`PATHS` view) with secure, login-guarded path detail views (`ROADMAP` and `STUDY` console) that automatically redirect unauthenticated users to the login page.

---

## 📂 Repository Structure

```text
bugfix/
├── backend/                # Spring Boot REST API (Port 8080)
│   ├── src/main/java/      # Feature-packaged code (user, paths, common/security)
│   ├── src/main/resources/ # Configuration & db/migration scripts
│   └── pom.xml             # Maven dependencies
├── ui/                     # React + TypeScript + Vite Client (Port 5173)
│   ├── src/features/       # Feature-specific modules (auth, dashboard, roadmap)
│   ├── src/shared/         # Shared API utilities, UI widgets, and global hooks
│   └── package.json        # Frontend configuration
├── run.sh                  # Automation script to start both backend & frontend
├── stop.sh                 # Automation script to stop port processes
└── README.md               # Main instructions (this file)
```

---

## 🚀 Getting Started

### Prerequisites
*   Java Development Kit (JDK) 17 or higher
*   Node.js (v18+) & npm
*   PostgreSQL running locally on port `5432`

### Setup Database
Before starting the application, ensure a database named `learnnow` exists in your local PostgreSQL:
```sql
CREATE DATABASE learnnow;
```

### Start Both Servers (Recommended)
You can start the compilation, database migrations, and development servers using the provided shell script in the root directory:
```bash
chmod +x run.sh stop.sh
./run.sh
```
This automatically compiles the Java backend, boots the Spring Boot server on port `8080`, seeds the default learning tracks, and runs the Vite client dev server on `http://localhost:5173/`.

### Stop Both Servers
To terminate all background processes binding ports `8080` and `5173`:
```bash
./stop.sh
```

---

## 🧪 Testing the Authentication Flow
1. Go to `http://localhost:5173/` and click **Create account**.
2. Register with your details.
3. Fetch the verification link printed in the backend console logs.
4. Paste the link into your browser to verify the account.
5. Log in with your email and password to gain full access to the learning console.

---

## 🤝 Contributing Guide
Please read [CONTRIBUTING.md](CONTRIBUTING.md) to understand our coding standards, branch conventions, and layout structures when introducing new modules or fixing bugs.

---

## 📚 References
*   [Owl Stickers Pack Reference](https://www.flaticon.com/stickers-pack/owl-2)
