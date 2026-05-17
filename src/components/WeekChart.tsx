import { useTaskStore } from "../store/taskStore";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

function getWeekDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ date: dateStr, label: i === 0 ? "今" : WEEKDAY[d.getDay()], isToday: i === 0 });
  }
  return days;
}

/**
 * 近 7 天番茄钟完成数柱状图，纯 CSS flex 实现，零依赖。
 */
export function WeekChart() {
  const dailyStats = useTaskStore((s) => s.dailyStats);
  const days = getWeekDays();

  const values = days.map(
    ({ date }) => dailyStats.find((s) => s.date === date)?.totalPomodoros ?? 0,
  );

  const max = Math.max(...values, 1);

  return (
    <section className="w-full">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        本周趋势
      </h2>
      <div className="rounded-2xl border border-neutral-100 bg-white px-4 pb-3 pt-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex h-20 items-end justify-between gap-1">
          {days.map(({ label, isToday }, i) => {
            const value = values[i];
            const pct = value > 0 ? Math.max(8, (value / max) * 100) : 0;

            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                {value > 0 && (
                  <span
                    className={`text-[10px] font-medium leading-none ${
                      isToday ? "text-pomodoro-500" : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {value}
                  </span>
                )}
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-sm transition-all duration-500 ${
                      isToday
                        ? "bg-pomodoro-500 dark:bg-pomodoro-400"
                        : value > 0
                          ? "bg-pomodoro-200 dark:bg-pomodoro-900"
                          : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                    style={{ height: value > 0 ? `${pct}%` : "4px" }}
                  />
                </div>
                <span
                  className={`text-[10px] leading-none ${
                    isToday
                      ? "font-semibold text-pomodoro-500"
                      : "text-neutral-400 dark:text-neutral-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
