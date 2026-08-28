# Task Manager

A modern, full-stack task management application designed to help users organize their daily activities with ease. Built with React, TypeScript, and Firebase.

## 🚀 Features

- **User Authentication**: Secure login and logout using Firebase Authentication.
- **Task CRUD**: Create, Read, Update, and Delete tasks in real-time.
- **Dedicated Task Creation**: A separate page for adding new tasks to minimize clutter.
- **Task Categorization**: Organize tasks into 'Personal' or 'Work' categories.
- **Status Tracking**: Monitor task progress with statuses: `Not Started`, `Started`, and `Completed`.
- **Advanced Filtering**: 
  - Filter tasks by specific creation date.
  - Filter tasks by status.
  - Filter tasks by category.
- **Responsive UI**: Built with Material UI and featuring a powerful DataGrid for efficient task management.

## 🛠️ Tech Stack

- **Frontend**: 
  - React 19
  - TypeScript
  - React Router (for navigation)
  - Material UI (MUI) & MUI X Data Grid
  - Emotion (for styling)
- **Backend**: 
  - Firebase Authentication
  - Cloud Firestore (NoSQL Database)
- **State Management**: 
  - React Hooks
  - `react-firebase-hooks`

## 🏁 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the application in development mode:
```bash
npm start
```
The app will be available at [http://localhost:3000](http://localhost:3000).

## 📜 Available Scripts

- `npm start`: Runs the app in development mode.
- `npm run build`: Builds the app for production to the `build` folder.
- `npm test`: Launches the test runner in interactive watch mode.
- `npm run eject`: One-way operation to eject from Create React App configuration.

## 📂 Project Structure

- `src/pages/`: Application pages (Task List, Add Task).
- `src/components/`: Reusable UI components (Auth, TaskList, Modals).
- `src/firebase/`: Firebase configuration and initialization.
- `src/types/`: TypeScript interfaces and type definitions.
- `public/`: Static assets and public HTML.
