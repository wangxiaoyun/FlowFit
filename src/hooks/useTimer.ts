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
 * 专注阶段结束时若 kegelEnabled，触发引导卡而非直接进入休息。
 */
export function useTimer() {
  const {
    status,
    remaining,
    phase,
    settings,
    tick,
    completePhase,
    activeTaskId,
    startKegelGuide,
    dismissKegelGuide,
  } = useTimerStore();
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

    // 专注结束 + 提肛开启：先展示引导卡，延迟 completePhase
    if (phase === "focus" && settings.kegelEnabled) {
      startKegelGuide();
      if (settings.soundEnabled) {
        playNotification(settings.volume);
        recordPomodoro();
        incrementPomodoro(activeTaskId);
      }
      if (settings.desktopNotify) {
        sendDesktopNotification("FlowFit", "专注完成！先来个提肛运动 💪");
      }
      if (settings.feishuWebhook) {
        const sessionCount = useTimerStore.getState().currentPomodoro + 1;
        sendFeishuWebhook(
          settings.feishuWebhook,
          `💪 FlowFit\n完成第 ${sessionCount} 个番茄钟\n休息前先做提肛运动！`
        );
      }
      // completePhase 由用户完成/跳过引导卡后调用（见 finishKegel）
      return;
    }

    // 休息结束 或 提肛关闭时走原有逻辑
    const newPhase = completePhase();
    if (useTimerStore.getState().status === "running") {
      intervalRef.current = setInterval(() => tick(), 1000);
    }
    const isFocusDone = newPhase === "break" || newPhase === "longBreak";
    const isLongBreak = newPhase === "longBreak";

    if (settings.soundEnabled) {
      if (isFocusDone) {
        playNotification(settings.volume);
        recordPomodoro();
        incrementPomodoro(activeTaskId);
      } else {
        playBreakOver(settings.volume);
      }
    }

    if (settings.desktopNotify) {
      if (isLongBreak) {
        sendDesktopNotification("FlowFit", "完成一组！好好休息一下吧 ☕");
      } else if (isFocusDone) {
        sendDesktopNotification("FlowFit", "专注完成！休息 5 分钟 🌿");
      } else {
        sendDesktopNotification("FlowFit", "休息结束，继续加油！💪");
      }
    }

    if (isFocusDone && settings.feishuWebhook) {
      const sessionCount = useTimerStore.getState().currentPomodoro;
      const text = isLongBreak
        ? `💪 FlowFit\n完成第 ${sessionCount} 个番茄钟（长休息）\n好好休息一下！`
        : `💪 FlowFit\n完成第 ${sessionCount} 个番茄钟\n休息 5 分钟，放松一下`;
      sendFeishuWebhook(settings.feishuWebhook, text);
    }
  }, [remaining, status, phase, completePhase, settings, clearTick, recordPomodoro, incrementPomodoro, activeTaskId, startKegelGuide]);

  // 用户完成或跳过引导卡时调用，执行 completePhase 并重启计时器（用于 autoStartBreak）
  const finishKegel = useCallback(() => {
    dismissKegelGuide();
    completePhase();
    if (useTimerStore.getState().status === "running") {
      intervalRef.current = setInterval(() => tick(), 1000);
    }
  }, [dismissKegelGuide, completePhase, tick]);

  return { finishKegel };
}
