import { Clock, CheckCircle, Flame, Fire } from "@phosphor-icons/react";
import { useTaskStore } from "../store/taskStore";
import { useTimerStore } from "../store/timerStore";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 今日统计面板 + 连续天数 Streak。
 * 所有 selector 返回 primitive 值，避免无限重渲染。
 */
export function StatsPanel() {
  const totalPomodoros = useTaskStore((s) => {
    const today = getTodayStr();
    return s.dailyStats.find((d) => d.date === today)?.totalPomodoros ?? 0;
  });

  const completedTasks = useTaskStore((s) => {
    const today = getTodayStr();
    return s.dailyStats.find((d) => d.date === today)?.completedTasks ?? 0;
  });

  // 连续天数：从今天（或昨天）往前找连续有番茄记录的天数
  const streak = useTaskStore((s) => {
    const stats = s.dailyStats;

    function dateStrOf(daysAgo: number): string {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function hasPomodoros(daysAgo: number): boolean {
      return (stats.find((s) => s.date === dateStrOf(daysAgo))?.totalPomodoros ?? 0) > 0;
    }

    // 今天已完成则从今天开始算，否则从昨天开始（不因今天未打卡而断链）
    const start = hasPomodoros(0) ? 0 : 1;
    let count = 0;
    for (let i = start; i <= 366; i++) {
      if (hasPomodoros(i)) count++;
      else break;
    }
    return count;
  });

  const currentPomodoro = useTimerStore((s) => s.currentPomodoro);

  const stats = [
    {
      icon: Clock,
      label: "今日番茄",
      value: totalPomodoros,
      color: "text-pomodoro-500",
      bg: "bg-pomodoro-50 dark:bg-pomodoro-500/10",
    },
    {
      icon: Flame,
      label: "连续番茄",
      value: currentPomodoro,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      icon: CheckCircle,
      label: "完成任务",
      value: completedTasks,
      color: "text-break-500",
      bg: "bg-break-50 dark:bg-break-500/10",
    },
    {
      icon: Fire,
      label: "连续天数",
      value: streak,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
  ] as const;

  return (
    <section className="w-full">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        今日
      </h2>
      <div className="grid grid-cols-4 gap-2">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 ${bg}`}
          >
            <Icon size={18} className={color} weight="duotone" />
            <span className="text-base font-semibold text-neutral-900 dark:text-white">
              {value}
            </span>
            <span className="text-center text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
