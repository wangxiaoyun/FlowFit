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

/** 近 7 天番茄钟热力格子，颜色深浅代表数量，数字居中显示。 */
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
      <div className="rounded-2xl border border-neutral-100 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex justify-between gap-1.5">
          {days.map(({ label, isToday }, i) => {
            const value = values[i];
            const intensity = value / max;

            // 根据强度和是否今天决定格子样式
            let cellCls: string;
            let numCls: string;
            if (value === 0) {
              cellCls = "bg-neutral-100 dark:bg-neutral-800";
              numCls = "text-neutral-300 dark:text-neutral-600";
            } else if (isToday) {
              cellCls = "bg-pomodoro-500 dark:bg-pomodoro-400";
              numCls = "text-white";
            } else if (intensity >= 0.75) {
              cellCls = "bg-pomodoro-400 dark:bg-pomodoro-600";
              numCls = "text-white";
            } else if (intensity >= 0.5) {
              cellCls = "bg-pomodoro-300 dark:bg-pomodoro-700";
              numCls = "text-pomodoro-900 dark:text-pomodoro-100";
            } else if (intensity >= 0.25) {
              cellCls = "bg-pomodoro-200 dark:bg-pomodoro-800";
              numCls = "text-pomodoro-800 dark:text-pomodoro-200";
            } else {
              cellCls = "bg-pomodoro-100 dark:bg-pomodoro-900";
              numCls = "text-pomodoro-700 dark:text-pomodoro-300";
            }

            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all ${cellCls}`}
                >
                  <span className={numCls}>
                    {value > 0 ? value : "·"}
                  </span>
                </div>
                <span
                  className={`text-[10px] leading-none ${
                    isToday
                      ? "font-semibold text-pomodoro-500 dark:text-pomodoro-400"
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
