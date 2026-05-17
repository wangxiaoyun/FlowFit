import type { Settings } from "../types";

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  theme: "system",
  soundEnabled: true,
  volume: 0.5,
  desktopNotify: true,
  feishuWebhook: "",
};

export const STORAGE_KEYS = {
  SETTINGS: "pomodoro-settings",
  TASKS: "pomodoro-tasks",
  STATS: "pomodoro-stats",
  TODAY_POMODOROS: "pomodoro-today-count",
  CONSECUTIVE: "pomodoro-consecutive",
  LAST_DATE: "pomodoro-last-date",
} as const;

export const PHASE_COLORS = {
  focus: {
    stroke: "#ef4444",
    track: "#fecaca",
    darkStroke: "#f87171",
    darkTrack: "rgba(239, 68, 68, 0.15)",
  },
  break: {
    stroke: "#22c55e",
    track: "#bbf7d0",
    darkStroke: "#4ade80",
    darkTrack: "rgba(34, 197, 94, 0.15)",
  },
} as const;
