import { create } from "zustand";
import type { Milestone, MilestoneTask } from "../types";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";

interface MilestoneStore {
  milestones: Milestone[];

  addMilestone: (title: string) => void;
  removeMilestone: (id: string) => void;
  toggleCollapse: (id: string) => void;
  updateMilestoneTitle: (id: string, title: string) => void;

  addMilestoneTask: (milestoneId: string, title: string) => void;
  removeMilestoneTask: (milestoneId: string, taskId: string) => void;
  toggleMilestoneTask: (milestoneId: string, taskId: string) => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function persist(milestones: Milestone[]) {
  saveToStorage(STORAGE_KEYS.MILESTONES, milestones);
}

export const useMilestoneStore = create<MilestoneStore>((set, get) => ({
  milestones: loadFromStorage<Milestone[]>(STORAGE_KEYS.MILESTONES, []),

  addMilestone: (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const item: Milestone = {
      id: generateId(),
      title: trimmed,
      tasks: [],
      collapsed: false,
      createdAt: Date.now(),
    };
    const milestones = [...get().milestones, item];
    persist(milestones);
    set({ milestones });
  },

  removeMilestone: (id: string) => {
    const milestones = get().milestones.filter((m) => m.id !== id);
    persist(milestones);
    set({ milestones });
  },

  toggleCollapse: (id: string) => {
    const milestones = get().milestones.map((m) =>
      m.id === id ? { ...m, collapsed: !m.collapsed } : m,
    );
    persist(milestones);
    set({ milestones });
  },

  updateMilestoneTitle: (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const milestones = get().milestones.map((m) =>
      m.id === id ? { ...m, title: trimmed } : m,
    );
    persist(milestones);
    set({ milestones });
  },

  addMilestoneTask: (milestoneId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: MilestoneTask = {
      id: generateId(),
      title: trimmed,
      done: false,
      createdAt: Date.now(),
    };
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId ? { ...m, tasks: [...m.tasks, task] } : m,
    );
    persist(milestones);
    set({ milestones });
  },

  removeMilestoneTask: (milestoneId: string, taskId: string) => {
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
        : m,
    );
    persist(milestones);
    set({ milestones });
  },

  toggleMilestoneTask: (milestoneId: string, taskId: string) => {
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            tasks: m.tasks.map((t) =>
              t.id === taskId ? { ...t, done: !t.done } : t,
            ),
          }
        : m,
    );
    persist(milestones);
    set({ milestones });
  },
}));
