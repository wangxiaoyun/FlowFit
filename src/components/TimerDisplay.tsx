import { CircularProgress } from "./CircularProgress";
import { TimerControls } from "./TimerControls";
import { useTimerStore } from "../store/timerStore";
import { useTimer } from "../hooks/useTimer";
import { PHASE_COLORS } from "../constants";

/**
 * 计时器主视图：阶段标签、环形进度、时间显示、控制按钮。
 */
export function TimerDisplay() {
  const { phase, status, remaining, settings } = useTimerStore();
  useTimer(); // 驱动 1 秒间隔

  const totalSeconds =
    phase === "focus" ? settings.focusDuration * 60 : settings.breakDuration * 60;
  const progress = 1 - remaining / totalSeconds;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const colors = PHASE_COLORS[phase];
  const isDark = document.documentElement.classList.contains("dark");
  const strokeColor = isDark ? colors.darkStroke : colors.stroke;
  const trackColor = isDark ? colors.darkTrack : colors.track;

  const phaseLabel = phase === "focus" ? "专注" : "休息";

  const statusLabel = (() => {
    if (phase === "focus") {
      if (status === "idle") return " — 准备就绪";
      if (status === "running") return " — 进行中";
      if (status === "paused") return " — 已暂停";
    } else {
      if (status === "idle") return " — 开始休息";
      if (status === "running") return " — 休息中";
    }
    return "";
  })();

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 阶段标签 */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            phase === "focus"
              ? "bg-pomodoro-500 dark:bg-pomodoro-400"
              : "bg-break-500 dark:bg-break-400"
          }`}
        />
        <span className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
          {phaseLabel}{statusLabel}
        </span>
      </div>

      {/* 环形进度 + 时间 */}
      <CircularProgress
        size={280}
        strokeWidth={6}
        progress={progress}
        strokeColor={strokeColor}
        trackColor={trackColor}
      >
        <div className="text-center">
          <span className="font-mono text-5xl font-light tracking-tight text-neutral-900 dark:text-white sm:text-6xl">
            {timeStr}
          </span>
        </div>
      </CircularProgress>

      {/* 控制按钮 */}
      <TimerControls />
    </div>
  );
}
