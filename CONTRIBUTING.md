# Contributing to Bugfix Academy

Thank you for contributing to Bugfix Academy! To maintain code quality, premium UX consistency, and structural cleanliness, please adhere to the following guidelines.

---

## Code Architecture Guidelines

We enforce a **feature-based package structure** for both the frontend and backend.

### 1. Frontend Architecture (`/ui`)

All UI logic is grouped by domain feature folders under `/src/features`.

- **Features**: Place feature-specific components, custom hooks, API calls, and types within `src/features/<feature-name>`.
- **Shared Widgets**: General layout tools (e.g., buttons, inputs) go into `src/shared/components`.
- **Types**: Common model contracts go to `/src/types.ts` or feature-specific type definitions.
- **Styling Guidelines**:
  - **CSS Modules Only**: Use CSS modules (`[ComponentName].module.css`) for component encapsulation.
  - **No Tailwind CSS**: Avoid Tailwind CSS. Leverage standard CSS with values retrieved from custom variables.
  - **Theme support**: Use global CSS variables (declared in `src/styles/variables.css`) to ensure visual compliance in both Light and Dark modes.
  - **Typography**: The displays and body must strictly use `'Figtree', sans-serif` as imported in the global layout.

### 2. Backend Architecture (`/backend`)

Java packages are structured by context domain directories under `com.learnnow`:

- **Entities**: Keep Hibernate mapping classes in `com.learnnow.paths.entity`.
- **Controllers**: Expose JSON API interfaces inside `com.learnnow.paths.controller`.
- **Data Seeding**: Populate default tracks/quizzes inside `com.learnnow.paths.config.DatabaseSeeder`.

---

## Coding Standards & Build Safety

1. **Strict Type Safety**: Unused imports or declared variables will trigger compilation warnings/errors under our current build configuration and cause production builds (`npm run build`) to fail. Clean up unused lines before committing.
2. **REST API Compliance**: Ensure controllers return standardized payloads and respect CORS policies configurations.
3. **Responsive layouts**: Sidebar and main scroll layout view-ports should rely on standard CSS flexboxes and calc values rather than absolute alignments.

---

## Development Workflow

1. Create a feature branch off main: `feature/your-feature-name`.
2. Implement your work under feature package structures.
3. Run compiler verification tests:
   - Frontend: `npm run build` inside `ui` directory.
   - Backend: Ensure application boots cleanly using `mvn spring-boot:run`.
4. Create a pull request detailing your changes.
