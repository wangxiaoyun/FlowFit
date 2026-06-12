import { create } from "zustand";
import type { Milestone, MilestoneTask, TaskAttachment } from "../types";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";
import { writeDataFile } from "../utils/fileStorage";
import { useTimerStore } from "./timerStore";
import { removeAttachmentFile } from "../utils/taskAttachments";

interface MilestoneStore {
  milestones: Milestone[];

  addMilestone: (title: string) => void;
  removeMilestone: (id: string) => void;
  toggleCollapse: (id: string) => void;
  updateMilestoneTitle: (id: string, title: string) => void;
  reorderMilestones: (fromIndex: number, toIndex: number) => void;

  addMilestoneTask: (milestoneId: string, title: string) => void;
  removeMilestoneTask: (milestoneId: string, taskId: string) => void;
  toggleMilestoneTask: (milestoneId: string, taskId: string) => void;
  updateTaskCompletedAt: (milestoneId: string, taskId: string, completedAt: string) => void;
  updateMilestoneTaskDetails: (
    milestoneId: string,
    taskId: string,
    details: Partial<Pick<MilestoneTask, "title" | "description" | "completedAt">>,
  ) => void;
  addMilestoneTaskAttachment: (
    milestoneId: string,
    taskId: string,
    attachment: TaskAttachment,
  ) => void;
  removeMilestoneTaskAttachment: (
    milestoneId: string,
    taskId: string,
    attachmentId: string,
  ) => void;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getDataPath(): string {
  return useTimerStore.getState().settings.dataPath ?? "";
}

function persist(milestones: Milestone[]) {
  saveToStorage(STORAGE_KEYS.MILESTONES, milestones);
  const dp = getDataPath();
  if (dp) writeDataFile(dp, "pomodoro-milestones.json", milestones).catch(() => {});
}

function cleanupAttachments(attachments: TaskAttachment[] | undefined) {
  const dp = getDataPath();
  if (!dp || !attachments?.length) return;
  attachments.forEach((attachment) => {
    removeAttachmentFile(dp, attachment).catch(() => {});
  });
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
    const removed = get().milestones.find((m) => m.id === id);
    removed?.tasks.forEach((task) => cleanupAttachments(task.attachments));
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

  reorderMilestones: (fromIndex: number, toIndex: number) => {
    const arr = [...get().milestones];
    const [item] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, item);
    persist(arr);
    set({ milestones: arr });
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
    const removed = get()
      .milestones.find((m) => m.id === milestoneId)
      ?.tasks.find((t) => t.id === taskId);
    cleanupAttachments(removed?.attachments);
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
        : m,
    );
    persist(milestones);
    set({ milestones });
  },

  toggleMilestoneTask: (milestoneId: string, taskId: string) => {
    const milestones = get().milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      return {
        ...m,
        tasks: m.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const nowDone = !t.done;
          return {
            ...t,
            done: nowDone,
            // 勾选时自动记录完成时间，取消勾选时清除
            completedAt: nowDone ? formatNow() : undefined,
          };
        }),
      };
    });
    persist(milestones);
    set({ milestones });
  },

  updateTaskCompletedAt: (milestoneId: string, taskId: string, completedAt: string) => {
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            tasks: m.tasks.map((t) =>
              t.id === taskId ? { ...t, completedAt } : t,
            ),
          }
        : m,
    );
    persist(milestones);
    set({ milestones });
  },

  updateMilestoneTaskDetails: (milestoneId, taskId, details) => {
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            tasks: m.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const nextTitle = details.title?.trim();
              return {
                ...t,
                ...(nextTitle ? { title: nextTitle } : {}),
                ...(details.description !== undefined
                  ? { description: details.description }
                  : {}),
                ...(details.completedAt !== undefined
                  ? { completedAt: details.completedAt || undefined }
                  : {}),
              };
            }),
          }
        : m,
    );
    persist(milestones);
    set({ milestones });
  },

  addMilestoneTaskAttachment: (milestoneId, taskId, attachment) => {
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            tasks: m.tasks.map((t) =>
              t.id === taskId
                ? { ...t, attachments: [...(t.attachments ?? []), attachment] }
                : t,
            ),
          }
        : m,
    );
    persist(milestones);
    set({ milestones });
  },

  removeMilestoneTaskAttachment: (milestoneId, taskId, attachmentId) => {
    let removed: TaskAttachment | undefined;
    const milestones = get().milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            tasks: m.tasks.map((t) => {
              if (t.id !== taskId) return t;
              removed = t.attachments?.find((item) => item.id === attachmentId);
              return {
                ...t,
                attachments: (t.attachments ?? []).filter((item) => item.id !== attachmentId),
              };
            }),
          }
        : m,
    );
    cleanupAttachments(removed ? [removed] : undefined);
    persist(milestones);
    set({ milestones });
  },
}));
