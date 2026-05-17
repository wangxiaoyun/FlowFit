import { CircularProgress } from "./CircularProgress";
import { TimerControls } from "./TimerControls";
import { useTimerStore } from "../store/timerStore";
import { useTimer } from "../hooks/useTimer";
import { PHASE_COLORS } from "../constants";
import { useTaskStore } from "../store/taskStore";

/**
 * 计时器主视图：阶段标签、环形进度、时间、控制按钮。
 */
export function TimerDisplay() {
  const { phase, status, remaining, settings, sessionCount, activeTaskId } = useTimerStore();
  // 从 taskStore 中查找当前激活任务的标题，用于在计时环内展示
  const activeTaskTitle = useTaskStore((s) =>
    activeTaskId ? (s.tasks.find((t) => t.id === activeTaskId)?.title ?? null) : null
  );
  useTimer();

  const totalSeconds =
    phase === "focus"
      ? settings.focusDuration * 60
      : phase === "longBreak"
        ? settings.longBreakDuration * 60
        : settings.breakDuration * 60;

  const progress = 1 - remaining / totalSeconds;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const colors = PHASE_COLORS[phase];
  const isDark = document.documentElement.classList.contains("dark");
  const strokeColor = isDark ? colors.darkStroke : colors.stroke;
  const trackColor = isDark ? colors.darkTrack : colors.track;

  // 阶段标签
  const phaseLabel = phase === "focus" ? "专注" : phase === "longBreak" ? "长休息" : "休息";
  const statusSuffix = (() => {
    if (status === "idle") return phase === "focus" ? " — 准备就绪" : " — 开始休息";
    if (status === "running") return phase === "focus" ? " — 进行中" : " — 休息中";
    if (status === "paused") return " — 已暂停";
    return "";
  })();

  // 长休息提示：显示本轮第几个番茄
  const longBreakHint =
    phase !== "focus"
      ? null
      : settings.longBreakInterval > 0
        ? `${sessionCount % settings.longBreakInterval}/${settings.longBreakInterval}`
        : null;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 阶段标签 */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              phase === "focus"
                ? "bg-pomodoro-500 dark:bg-pomodoro-400"
                : phase === "longBreak"
                  ? "bg-violet-500 dark:bg-violet-400"
                  : "bg-break-500 dark:bg-break-400"
            }`}
          />
          <span className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
            {phaseLabel}{statusSuffix}
          </span>
        </div>
        {/* 长休息倒计提示 */}
        {longBreakHint && (
          <span className="text-xs text-neutral-400 dark:text-neutral-600">
            本轮 {longBreakHint}，每 {settings.longBreakInterval} 个长休息
          </span>
        )}
      </div>

      {/* 环形进度 + 时间 */}
      <CircularProgress
        size={280}
        strokeWidth={6}
        progress={progress}
        strokeColor={strokeColor}
        trackColor={trackColor}
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          {/* 若有激活任务则显示任务名胶囊标签 */}
          {activeTaskTitle && (
            <span className="max-w-[160px] truncate text-xs text-neutral-500 dark:text-neutral-400">
              📌 {activeTaskTitle}
            </span>
          )}
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
