# Copilot Instructions for `daodao-secondary-gui`

This document provides guidance for AI coding agents working on the `daodao-secondary-gui` project. It outlines the architecture, workflows, conventions, and integration points to help agents be productive and align with the project's standards.

## Project Overview

This project is a React + TypeScript application built with Vite. It is designed as a secondary GUI for the DaoDao platform, with a focus on modularity and reusability. The project uses modern front-end technologies and follows best practices for TypeScript and React development.

### Key Technologies
- **React**: Front-end framework for building user interfaces.
- **TypeScript**: Strongly-typed JavaScript for better code quality.
- **Vite**: Fast build tool for modern web projects.
- **ESLint**: Linting tool with custom configurations for React and TypeScript.

### Project Structure
- **`src/`**: Main source code directory.
  - **`components/`**: Reusable UI components.
    - **`theme-provider.tsx`**: Provides theming context for the application.
    - **`ui/`**: Contains atomic UI components like buttons, inputs, and cards.
    - **`dao/`**: Components specific to DAO-related functionality (e.g., `AppsTab.tsx`, `MembersTab.tsx`).
    - **`layout/`**: Layout components such as `Header`, `Footer`, and `Layout`.
  - **`daodao/`**: Core logic and utilities for interacting with the DaoDao platform.
    - **`types/contracts/`**: TypeScript definitions for various DAO-related contracts.
    - **`utils/`**: Shared utility functions and constants.
  - **`pages/`**: Top-level pages for the application (e.g., `LandingPage.tsx`, `DaoPage.tsx`).
  - **`hooks/`**: Custom React hooks (e.g., `useTheme.ts`).
  - **`lib/`**: Shared libraries for data storage and utility functions.
- **`public/`**: Static assets.
- **`docs/`**: Documentation files (e.g., `IMPLEMENTATION_NOTES.md`).
- **`tsconfig.*.json`**: TypeScript configuration files for different parts of the project.
- **`vite.config.ts`**: Vite configuration file.

## Developer Workflows

### Running the Development Server
To start the development server, use the following task:
- **Task**: `Run Development Server`
- **Command**: `npm run dev`
- **Description**: Starts the Vite development server with hot module replacement (HMR).

### Linting
The project uses ESLint with custom configurations for React and TypeScript. To run linting:
- **Command**: `npm run lint`
- **Configuration**: See `eslint.config.js` for details.

### Building the Project
To build the project for production:
- **Command**: `npm run build`
- **Output**: The production build is generated in the `dist/` directory.

### Testing
Testing setup is not explicitly mentioned in the current workspace. If tests are added, ensure they follow the project's conventions and are placed in a `tests/` directory or alongside the files they test.

## Project-Specific Conventions

1. **Component Organization**:
   - Components are organized into feature-based directories (e.g., `dao`, `ui`, `layout`).
   - Reusable components are placed in `ui/`.

2. **TypeScript Usage**:
   - TypeScript is used throughout the project for type safety.
   - Contract types are defined in `src/daodao/types/contracts/`.

3. **Styling**:
   - CSS files (e.g., `App.css`, `index.css`) are used for styling.
   - The `theme-provider.tsx` component manages theming.

4. **Utilities**:
   - Shared utility functions are located in `src/daodao/utils/` and `src/lib/`.

## Integration Points

- **External Dependencies**:
  - The project uses several external libraries, including `@vitejs/plugin-react`, `@vitejs/plugin-react-swc`, and custom ESLint plugins (`eslint-plugin-react-x`, `eslint-plugin-react-dom`).
  - Contract interactions are defined in `src/daodao/types/contracts/`.

- **Cross-Component Communication**:
  - The `theme-provider.tsx` component is a central point for managing application theming.
  - Custom hooks in `src/hooks/` are used for shared state and logic.

## Additional Notes
- Refer to `docs/IMPLEMENTATION_NOTES.md` for detailed implementation guidelines.
- Ensure all new code adheres to the existing project structure and conventions.
- Use the provided TypeScript configurations (`tsconfig.app.json`, `tsconfig.node.json`) for type checking.

For further questions or clarifications, please consult the project maintainers or refer to the documentation in the `docs/` directory.