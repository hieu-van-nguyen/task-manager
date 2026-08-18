# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm start`: Run the app in development mode
- `npm run build`: Build the app for production
- `npm test`: Launch the test runner in interactive watch mode

## Architecture

### Overview
A task management application built with React 19, TypeScript, and Firebase. It allows authenticated users to create, read, update, and delete (CRUD) tasks stored in Firestore.

### Tech Stack
- **Frontend**: React 19, TypeScript
- **UI Components**: Material UI (MUI), MUI X Data Grid
- **Backend**: Firebase (Auth, Firestore)
- **Hooks**: `react-firebase-hooks` for managing Firebase state (auth and firestore)

### Project Structure
- `src/App.tsx`: Main application component that orchestrates authentication and the task list.
- `src/components/`: UI components:
  - `AuthWrapper.tsx`: Handles authentication context and login/logout.
  - `TaskList.tsx`: Main dashboard for managing tasks, including filtering, adding, and displaying tasks in a DataGrid.
  - `EditTaskModal.tsx`: Modal for editing existing task details.
- `src/firebase/`: Firebase configuration and initialization (`config.ts`).
- `src/types/`: Shared TypeScript interfaces and types (e.g., `Task`, `TaskStatus`).

### Data Model
Tasks are stored in a Firestore collection named `tasks`. Each task document contains:
- `title` (string)
- `description` (string)
- `status` (string: 'not started' | 'started' | 'completed')
- `createdAt` (number/Timestamp)
- `userId` (string: references the authenticated user)
- `category` (string: 'Personal' | 'Work')
