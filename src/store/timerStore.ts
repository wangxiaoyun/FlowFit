import { create } from "zustand";
import type { TimerPhase, TimerStatus, Settings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";
import { loadFromStorage, saveToStorage } from "../utils/storage";

interface TimerStore {
  phase: TimerPhase;
  status: TimerStatus;
  remaining: number;         // seconds
  currentPomodoro: number;   // consecutive pomodoros in current session
  settings: Settings;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  completePhase: () => TimerPhase;  // returns the NEW phase after transition
  setPhase: (phase: TimerPhase) => void;
  updateSettings: (partial: Partial<Settings>) => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  phase: "focus",
  status: "idle",
  remaining: DEFAULT_SETTINGS.focusDuration * 60,
  currentPomodoro: loadFromStorage("pomodoro-consecutive", 0),
  settings: loadFromStorage("pomodoro-settings", DEFAULT_SETTINGS),

  start: () => {
    set({ status: "running" });
  },

  pause: () => {
    set({ status: "paused" });
  },

  resume: () => {
    set({ status: "running" });
  },

  reset: () => {
    const { settings } = get();
    set({
      status: "idle",
      remaining: settings.focusDuration * 60,
      phase: "focus",
    });
  },

  tick: () => {
    const { remaining, status } = get();
    if (status !== "running") return;
    if (remaining <= 1) return; // will be handled by completePhase
    set({ remaining: remaining - 1 });
  },

  /**
   * Called when remaining reaches 0.
   * Advances to the next phase, updates consecutive counter,
   * persists state, and returns the new phase so the hook can play sound.
   */
  completePhase: () => {
    const { phase, settings, currentPomodoro } = get();

    if (phase === "focus") {
      const newCount = currentPomodoro + 1;
      saveToStorage("pomodoro-consecutive", newCount);
      set({
        phase: "break",
        status: settings.autoStartBreak ? "running" : "idle",
        remaining: settings.breakDuration * 60,
        currentPomodoro: newCount,
      });
      return "break";
    } else {
      // Break is over, return to focus
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
    set({
      phase,
      status: "idle",
      remaining: phase === "focus" ? settings.focusDuration * 60 : settings.breakDuration * 60,
    });
  },

  updateSettings: (partial: Partial<Settings>) => {
    const { settings, phase } = get();
    const merged = { ...settings, ...partial };
    saveToStorage("pomodoro-settings", merged);
    set({
      settings: merged,
      // Recalculate remaining if idle and we changed the current phase's duration
      remaining: shouldRecalculate(phase, partial)
        ? (phase === "focus" ? merged.focusDuration : merged.breakDuration) * 60
        : get().remaining,
    });
  },
}));

function shouldRecalculate(
  phase: TimerPhase,
  partial: Partial<Settings>,
): boolean {
  return (
    (phase === "focus" && partial.focusDuration !== undefined) ||
    (phase === "break" && (partial.breakDuration !== undefined))
  );
}
