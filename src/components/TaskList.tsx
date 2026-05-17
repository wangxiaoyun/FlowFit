import { useState } from "react";
import { Plus, Trash, Check, Target } from "@phosphor-icons/react";
import { useTaskStore } from "../store/taskStore";
import { useTimerStore } from "../store/timerStore";

/** 生成今日日期字符串 YYYY-MM-DD */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 生成近 7 天的日期数组，index 0 = 今天 */
function getLast7Days(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label =
      i === 0 ? "今天" : i === 1 ? "昨天" : `${d.getMonth() + 1}/${d.getDate()}`;
    days.push({ date: dateStr, label });
  }
  return days;
}

/**
 * 任务管理面板：近 7 天日期切换、添加、删除、完成标记。
 * 旧任务若缺少 date 字段，回退到今天所在日期。
 */
export function TaskList() {
  const { tasks, addTask, removeTask, toggleComplete } = useTaskStore();
  const activeTaskId = useTimerStore((s) => s.activeTaskId);
  const setActiveTask = useTimerStore((s) => s.setActiveTask);
  const [input, setInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => todayStr());

  const days = getLast7Days();
  const isToday = selectedDate === todayStr();

  // 向后兼容：旧任务没有 date 字段时归入今天
  const dayTasks = tasks.filter((t) => (t.date ?? todayStr()) === selectedDate);
  const activeTasks = dayTasks.filter((t) => !t.completed);
  const completedTasks = dayTasks.filter((t) => t.completed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addTask(input);
    setInput("");
  };

  const handleActivate = (id: string) => {
    setActiveTask(activeTaskId === id ? null : id);
  };

  return (
    <section className="w-full">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        任务
      </h2>

      {/* 近 7 天日期胶囊 Tab */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {days.map(({ date, label }) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedDate === date
                ? "bg-pomodoro-500 text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 添加任务（仅今天可添加） */}
      {isToday && (
        <form onSubmit={handleSubmit} className="mb-5 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="添加任务..."
            maxLength={120}
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-pomodoro-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-pomodoro-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} weight="bold" />
            添加
          </button>
        </form>
      )}

      {/* 空状态 */}
      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {isToday ? "暂无任务，在上方输入后点击添加" : "这天没有任务记录"}
        </p>
      )}

      {/* 任务列表 */}
      <ul className="space-y-2">
        {activeTasks.map((task) => {
          const isActive = task.id === activeTaskId;
          return (
            <li
              key={task.id}
              onClick={() => isToday && handleActivate(task.id)}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                isActive
                  ? "border-l-[3px] border-l-pomodoro-500 border-pomodoro-300 bg-pomodoro-50 dark:border-pomodoro-600 dark:bg-pomodoro-500/10"
                  : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
              } ${isToday ? "cursor-pointer" : ""}`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 hover:border-pomodoro-400 dark:border-neutral-500 dark:hover:border-pomodoro-400"
                aria-label={`标记"${task.title}"为已完成`}
              >
                {task.completed && <Check size={12} weight="bold" className="text-pomodoro-500" />}
              </button>

              <span className="flex-1 text-sm text-neutral-900 dark:text-white">
                {task.title}
              </span>

              <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                <Target size={14} />
                {task.pomodoroCount}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`删除"${task.title}"`}
              >
                <Trash size={16} className="text-neutral-400 hover:text-red-500 dark:text-neutral-500" />
              </button>
            </li>
          );
        })}

        {/* 已完成任务 */}
        {completedTasks.length > 0 && (
          <>
            <li className="pt-3">
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                已完成（{completedTasks.length}）
              </span>
            </li>
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 opacity-60 dark:border-neutral-800 dark:bg-neutral-800/50"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-break-400 bg-break-50 dark:border-break-500 dark:bg-break-500/10">
                  <Check size={12} weight="bold" className="text-break-500" />
                </span>
                <span className="flex-1 text-sm text-neutral-500 line-through dark:text-neutral-400">
                  {task.title}
                </span>
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <Target size={14} />
                  {task.pomodoroCount}
                </span>
                <button
                  onClick={() => removeTask(task.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`删除"${task.title}"`}
                >
                  <Trash size={16} className="text-neutral-300 hover:text-red-500 dark:text-neutral-600" />
                </button>
              </li>
            ))}
          </>
        )}
      </ul>
    </section>
  );
}
