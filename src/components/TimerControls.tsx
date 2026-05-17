import { Play, Pause, ArrowClockwise } from "@phosphor-icons/react";
import { useTimerStore } from "../store/timerStore";

/**
 * 计时器操作按钮：开始、暂停、继续、重置。
 */
export function TimerControls() {
  const { status, start, pause, resume, reset } = useTimerStore();

  if (status === "idle") {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={start}
          className="flex items-center gap-2 rounded-full bg-pomodoro-500 px-8 py-3 text-sm font-medium text-white hover:bg-pomodoro-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pomodoro-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        >
          <Play weight="fill" size={18} />
          开始
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-neutral-300 p-3 text-neutral-500 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label="重置计时器"
        >
          <ArrowClockwise size={18} />
        </button>
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={pause}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 text-sm font-medium text-white hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        >
          <Pause weight="fill" size={18} />
          暂停
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-neutral-300 p-3 text-neutral-500 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label="重置计时器"
        >
          <ArrowClockwise size={18} />
        </button>
      </div>
    );
  }

  // 已暂停
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={resume}
        className="flex items-center gap-2 rounded-full bg-pomodoro-500 px-8 py-3 text-sm font-medium text-white hover:bg-pomodoro-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pomodoro-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
      >
        <Play weight="fill" size={18} />
        继续
      </button>
      <button
        onClick={reset}
        className="rounded-full border border-neutral-300 p-3 text-neutral-500 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
        aria-label="重置计时器"
      >
        <ArrowClockwise size={18} />
      </button>
    </div>
  );
}
