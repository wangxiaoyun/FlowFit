import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { KegelGuide } from "./KegelGuide";

interface Props {
  reps: number;
  holdSeconds: number;
}

/**
 * 桌面右下角浮窗专用页面，独立于主窗口渲染。
 * 完成或跳过时 invoke kegel_finished，由 Rust backend 向主窗口 emit 事件并关闭弹窗，
 * 避免前端跨窗口 emit 不可靠的问题。
 */
export default function KegelPopup({ reps, holdSeconds }: Props) {
  // 从 localStorage 读取与主窗口一致的 theme 设置
  useEffect(() => {
    const stored = localStorage.getItem("pomodoro-settings");
    let theme = "system";
    try {
      if (stored) theme = JSON.parse(stored)?.theme ?? "system";
    } catch {}

    const applyDark = () => document.documentElement.classList.add("dark");
    const applyLight = () => document.documentElement.classList.remove("dark");

    if (theme === "dark") {
      applyDark();
      return;
    }
    if (theme === "light") {
      applyLight();
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.matches ? applyDark() : applyLight();
    const handler = (e: MediaQueryListEvent) =>
      e.matches ? applyDark() : applyLight();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Rust backend 负责 emit kegel-done 给主窗口并关闭弹窗
  const handleDone = useCallback(() => {
    invoke("kegel_finished").catch(() => {});
  }, []);

  return (
    <div className="h-screen w-screen p-3">
      <KegelGuide
        reps={reps}
        holdSeconds={holdSeconds}
        onDone={handleDone}
        onSkip={handleDone}
      />
    </div>
  );
}
