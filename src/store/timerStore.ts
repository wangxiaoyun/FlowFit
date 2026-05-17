import { create } from "zustand";
import type { TimerPhase, TimerStatus, Settings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { writeDataFile } from "../utils/fileStorage";

interface TimerStore {
  phase: TimerPhase;
  status: TimerStatus;
  remaining: number;         // seconds
  currentPomodoro: number;   // 跨会话累计番茄数（显示用）
  sessionCount: number;      // 当前 session 内番茄数（长休息判断用，reset 时清零）
  settings: Settings;

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  completePhase: () => TimerPhase;
  setPhase: (phase: TimerPhase) => void;
  activeTaskId: string | null;
  setActiveTask: (id: string | null) => void;
  updateSettings: (partial: Partial<Settings>) => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  phase: "focus",
  status: "idle",
  remaining: DEFAULT_SETTINGS.focusDuration * 60,
  currentPomodoro: loadFromStorage("pomodoro-consecutive", 0),
  sessionCount: 0,
  settings: loadFromStorage("pomodoro-settings", DEFAULT_SETTINGS),
  activeTaskId: null,

  start: () => set({ status: "running" }),

  pause: () => set({ status: "paused" }),

  resume: () => set({ status: "running" }),

  reset: () => {
    const { settings } = get();
    set({
      status: "idle",
      remaining: settings.focusDuration * 60,
      phase: "focus",
      sessionCount: 0,
      activeTaskId: null,
    });
  },

  tick: () => {
    const { remaining, status } = get();
    if (status !== "running") return;
    if (remaining <= 0) return;
    set({ remaining: remaining - 1 });
  },

  completePhase: () => {
    const { phase, settings, currentPomodoro, sessionCount } = get();

    if (phase === "focus") {
      const newTotal = currentPomodoro + 1;
      const newSession = sessionCount + 1;
      saveToStorage("pomodoro-consecutive", newTotal);

      // 每 longBreakInterval 个番茄触发长休息
      const isLongBreak = newSession % settings.longBreakInterval === 0;
      const nextPhase: TimerPhase = isLongBreak ? "longBreak" : "break";
      const breakSecs = (isLongBreak ? settings.longBreakDuration : settings.breakDuration) * 60;

      set({
        phase: nextPhase,
        status: settings.autoStartBreak ? "running" : "idle",
        remaining: breakSecs,
        currentPomodoro: newTotal,
        sessionCount: newSession,
      });
      return nextPhase;
    } else {
      // break 或 longBreak 结束，回到专注
      set({
        phase: "focus",
        status: settings.autoStartFocus ? "running" : "idle",
        remaining: settings.focusDuration * 60,
      });
      return "focus";
    }
  },

  setPhase: (phase: TimerPhase) => {
    const { settings } = get();
    const remaining =
      phase === "focus"
        ? settings.focusDuration * 60
        : phase === "longBreak"
          ? settings.longBreakDuration * 60
          : settings.breakDuration * 60;
    set({ phase, status: "idle", remaining });
  },

  setActiveTask: (id: string | null) => set({ activeTaskId: id }),

  updateSettings: (partial: Partial<Settings>) => {
    const { settings, phase } = get();
    const merged = { ...settings, ...partial };
    saveToStorage("pomodoro-settings", merged);
    // 当有配置路径时，同步备份设置文件
    const dp = merged.dataPath;
    if (dp) writeDataFile(dp, "pomodoro-settings.json", merged).catch(() => {});
    set({
      settings: merged,
      remaining: shouldRecalculate(phase, partial)
        ? getDuration(phase, merged) * 60
        : get().remaining,
    });
  },
}));

function getDuration(phase: TimerPhase, s: Settings): number {
  if (phase === "focus") return s.focusDuration;
  if (phase === "longBreak") return s.longBreakDuration;
  return s.breakDuration;
}

function shouldRecalculate(phase: TimerPhase, partial: Partial<Settings>): boolean {
  return (
    (phase === "focus" && partial.focusDuration !== undefined) ||
    (phase === "break" && partial.breakDuration !== undefined) ||
    (phase === "longBreak" && partial.longBreakDuration !== undefined)
  );
}
