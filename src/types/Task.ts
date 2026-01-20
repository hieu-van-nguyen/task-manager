import { Timestamp } from "firebase/firestore";

export type TaskStatus = "not started" | "started" | "completed";

export interface Task {
  id: string; // The Firestore document ID
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: number; // Timestamp
  userId: string; // To ensure users only see their tasks
  category: string;
}
