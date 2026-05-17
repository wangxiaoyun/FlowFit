import { Clock, CheckCircle, Flame } from "@phosphor-icons/react";
import { useTaskStore } from "../store/taskStore";
import { useTimerStore } from "../store/timerStore";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 今日统计面板。
 * 每个 selector 返回基本值（number），避免每次返回新对象导致无限重渲染。
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
  ] as const;

  return (
    <section className="w-full">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        今日
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className={`flex flex-col items-center gap-2 rounded-2xl p-4 ${bg}`}
          >
            <Icon size={20} className={color} weight="duotone" />
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              {value}
            </span>
            <span className="text-center text-xs text-neutral-500 dark:text-neutral-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
