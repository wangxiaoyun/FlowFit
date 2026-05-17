import { create } from "zustand";
import type { Task, DailyStats } from "../types";
import { loadFromStorage, saveToStorage } from "../utils/storage";

interface TaskStore {
  tasks: Task[];
  dailyStats: DailyStats[];

  // Actions
  addTask: (title: string) => void;
  removeTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  incrementPomodoro: (id: string | null) => void; // null = no active task
  getTodayStats: () => { totalPomodoros: number; completedTasks: number };
  recordPomodoro: () => void;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: loadFromStorage("pomodoro-tasks", []),
  dailyStats: loadFromStorage("pomodoro-stats", []),

  addTask: (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const newTask: Task = {
      id: generateId(),
      title: trimmed,
      pomodoroCount: 0,
      completed: false,
      createdAt: Date.now(),
      date: today(),
    };
    const tasks = [...get().tasks, newTask];
    saveToStorage("pomodoro-tasks", tasks);
    set({ tasks });
  },

  removeTask: (id: string) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    saveToStorage("pomodoro-tasks", tasks);
    set({ tasks });
  },

  toggleComplete: (id: string) => {
    const tasks = get().tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
    saveToStorage("pomodoro-tasks", tasks);
    set({ tasks });
  },

  incrementPomodoro: (id: string | null) => {
    if (!id) return;
    const tasks = get().tasks.map((t) =>
      t.id === id ? { ...t, pomodoroCount: t.pomodoroCount + 1 } : t,
    );
    saveToStorage("pomodoro-tasks", tasks);
    set({ tasks });
  },

  getTodayStats: () => {
    const todayStr = today();
    const stats = get().dailyStats.find((s) => s.date === todayStr);
    return {
      totalPomodoros: stats?.totalPomodoros ?? 0,
      completedTasks: stats?.completedTasks ?? 0,
    };
  },

  recordPomodoro: () => {
    const todayStr = today();
    const stats = [...get().dailyStats];
    const idx = stats.findIndex((s) => s.date === todayStr);

    if (idx >= 0) {
      stats[idx] = {
        ...stats[idx],
        totalPomodoros: stats[idx].totalPomodoros + 1,
      };
    } else {
      stats.push({
        date: todayStr,
        totalPomodoros: 1,
        completedTasks: 0,
      });
    }

    // Keep last 90 days
    const pruned = stats.slice(-90);
    saveToStorage("pomodoro-stats", pruned);
    set({ dailyStats: pruned });
  },
}));
