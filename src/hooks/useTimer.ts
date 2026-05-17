import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "../store/timerStore";
import { useTaskStore } from "../store/taskStore";
import { playNotification, playBreakOver } from "../utils/audio";
import {
  requestDesktopPermission,
  sendDesktopNotification,
  sendFeishuWebhook,
} from "../utils/notify";

/**
 * Core timer orchestration hook.
 * Manages the 1-second interval, completion detection,
 * sound/desktop/Feishu notifications, and pomodoro recording.
 */
export function useTimer() {
  const { status, remaining, settings, tick, completePhase } =
    useTimerStore();

  const { recordPomodoro } = useTaskStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const permRequestedRef = useRef(false);

  // Request desktop notification permission once on mount
  useEffect(() => {
    if (permRequestedRef.current) return;
    permRequestedRef.current = true;
    requestDesktopPermission();
  }, []);

  // Clear interval helper
  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start / stop interval based on status
  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      clearTick();
    }
    return clearTick;
  }, [status, tick, clearTick]);

  // ── Completion handler ──────────────────────────────────────────────
  useEffect(() => {
    if (status !== "running" || remaining > 0) {
      completedRef.current = false;
      return;
    }

    // Prevent double-fire
    if (completedRef.current) return;
    completedRef.current = true;

    clearTick();

    const newPhase = completePhase();
    const isFocusDone = newPhase === "break";

    // 1) Sound notification
    if (settings.soundEnabled) {
      if (isFocusDone) {
        playNotification(settings.volume);
        recordPomodoro();
      } else {
        playBreakOver(settings.volume);
      }
    }

    // 2) Desktop notification (browser Notification API)
    if (settings.desktopNotify) {
      if (isFocusDone) {
        sendDesktopNotification(
          "Pomodoro Timer",
          "Focus session complete! Time for a break.",
        );
      } else {
        sendDesktopNotification(
          "Pomodoro Timer",
          "Break is over. Ready to focus?",
        );
      }
    }

    // 3) Feishu webhook push
    if (isFocusDone && settings.feishuWebhook) {
      const sessionCount = useTimerStore.getState().currentPomodoro;
      const text =
        `🍅 Pomodoro Timer\n` +
        `完成第 ${sessionCount} 个番茄钟\n` +
        `休息 5 分钟，放松一下`;

      // Fire-and-forget; don't block the UI
      sendFeishuWebhook(settings.feishuWebhook, text);
    }
  }, [remaining, status, completePhase, settings, clearTick, recordPomodoro]);
}
