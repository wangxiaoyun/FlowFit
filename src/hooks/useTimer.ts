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
 * 计时器核心编排 Hook。
 * 管理 1 秒间隔、阶段完成检测、声音/桌面/飞书通知、番茄记录。
 */
export function useTimer() {
  const { status, remaining, settings, tick, completePhase, activeTaskId } = useTimerStore();
  const { recordPomodoro, incrementPomodoro } = useTaskStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const permRequestedRef = useRef(false);

  useEffect(() => {
    if (permRequestedRef.current) return;
    permRequestedRef.current = true;
    requestDesktopPermission();
  }, []);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => tick(), 1000);
    } else {
      clearTick();
    }
    return clearTick;
  }, [status, tick, clearTick]);

  useEffect(() => {
    if (status !== "running" || remaining > 0) {
      completedRef.current = false;
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;

    clearTick();
    const newPhase = completePhase();
    // autoStart 模式下 completePhase 将 status 保持为 "running"，
    // 但 status 值未发生变化，第一个 effect 不会重新触发创建新 interval，
    // 需要在此处手动重启。
    if (useTimerStore.getState().status === "running") {
      intervalRef.current = setInterval(() => tick(), 1000);
    }
    const isFocusDone = newPhase === "break" || newPhase === "longBreak";
    const isLongBreak = newPhase === "longBreak";

    // 声音通知
    if (settings.soundEnabled) {
      if (isFocusDone) {
        playNotification(settings.volume);
        recordPomodoro();
        incrementPomodoro(activeTaskId);
      } else {
        playBreakOver(settings.volume);
      }
    }

    // 桌面通知
    if (settings.desktopNotify) {
      if (isLongBreak) {
        sendDesktopNotification("番茄钟", "完成一组！好好休息一下吧 ☕");
      } else if (isFocusDone) {
        sendDesktopNotification("番茄钟", "专注完成！休息 5 分钟 🌿");
      } else {
        sendDesktopNotification("番茄钟", "休息结束，继续加油！💪");
      }
    }

    // 飞书 Webhook
    if (isFocusDone && settings.feishuWebhook) {
      const sessionCount = useTimerStore.getState().currentPomodoro;
      const text = isLongBreak
        ? `🍅 番茄钟\n完成第 ${sessionCount} 个番茄钟（长休息）\n好好休息一下！`
        : `🍅 番茄钟\n完成第 ${sessionCount} 个番茄钟\n休息 5 分钟，放松一下`;
      sendFeishuWebhook(settings.feishuWebhook, text);
    }
  }, [remaining, status, completePhase, settings, clearTick, recordPomodoro, incrementPomodoro, activeTaskId]);
}
