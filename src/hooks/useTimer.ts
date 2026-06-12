import { useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useTimerStore } from "../store/timerStore";
import { useTaskStore } from "../store/taskStore";
import { playNotification, playBreakOver } from "../utils/audio";
import { isTauri } from "../utils/fileStorage";
import {
  requestDesktopPermission,
  sendDesktopNotification,
} from "../utils/notify";

/**
 * 计时器核心编排 Hook。
 * 管理 1 秒间隔、阶段完成检测、声音/桌面通知、番茄记录。
 * 专注阶段结束时若选择了休息活动，通过 Tauri command 在桌面右下角弹出引导窗口，
 * 并监听 "kegel-done" 事件来执行 completePhase。
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

  // 用户完成或跳过引导卡后执行 completePhase 并重启计时器
  const finishKegel = useCallback(() => {
    completePhase();
    // 清除可能残留的旧间隔，防止与 effect 47 cleanup 产生竞态导致多间隔并存
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    if (useTimerStore.getState().status === "running") {
      intervalRef.current = setInterval(() => tick(), 1000);
    }
  }, [completePhase, tick]);

  // 用 ref 避免 listen effect 对 finishKegel 产生闭包依赖
  const finishKegelRef = useRef(finishKegel);

  useEffect(() => {
    finishKegelRef.current = finishKegel;
  }, [finishKegel]);

  // 监听弹窗发出的 kegel-done 事件，触发 completePhase
  useEffect(() => {
    if (!isTauri) return;
    const unlistenPromise = listen("kegel-done", () => {
      finishKegelRef.current();
    });
    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (status !== "running" || remaining > 0) {
      completedRef.current = false;
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;

    clearTick();

    // 专注结束 + 休息活动开启：打开桌面右下角浮窗，不占用主页面
    if (phase === "focus" && settings.restActivityType !== "none") {
      // 先处理通知和番茄记录（无论弹窗是否成功都要做）
      if (settings.soundEnabled) {
        playNotification(settings.volume);
        recordPomodoro();
        incrementPomodoro(activeTaskId);
      }
      if (settings.desktopNotify) {
        sendDesktopNotification("FlowFit", "专注完成！先活动一下再休息");
      }
      invoke("show_kegel_popup", {
        activityType: settings.restActivityType,
        reps: settings.kegelReps,
        holdSeconds: settings.kegelHoldSeconds,
      }).catch((err) => {
        // 弹窗失败兜底：直接进入休息阶段，防止计时器卡在 00:00
        console.error("休息活动弹窗打开失败，回退直接进入休息：", err);
        completePhase();
        if (useTimerStore.getState().status === "running") {
          intervalRef.current = setInterval(() => tick(), 1000);
        }
      });
      // completePhase 由弹窗 kegel-done 事件触发（见上方 listen）
      return;
    }

    // 休息结束 或 休息活动关闭时走原有逻辑
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

  }, [remaining, status, phase, completePhase, settings, clearTick, recordPomodoro, incrementPomodoro, activeTaskId, tick]);
}
