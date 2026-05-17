import { useState } from "react";
import {
  Plus,
  Trash,
  Check,
  CaretDown,
  CaretRight,
  Flag,
} from "@phosphor-icons/react";
import { useMilestoneStore } from "../store/milestoneStore";

/** 单个里程碑卡片，含折叠/展开、子任务管理 */
function MilestoneCard({ id }: { id: string }) {
  const { milestones, removeMilestone, toggleCollapse, addMilestoneTask, removeMilestoneTask, toggleMilestoneTask } =
    useMilestoneStore();
  const milestone = milestones.find((m) => m.id === id);
  const [taskInput, setTaskInput] = useState("");

  if (!milestone) return null;

  const done = milestone.tasks.filter((t) => t.done).length;
  const total = milestone.tasks.length;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    addMilestoneTask(id, taskInput);
    setTaskInput("");
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {/* 里程碑标题行 */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => toggleCollapse(id)}
          className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label={milestone.collapsed ? "展开" : "折叠"}
        >
          {milestone.collapsed ? (
            <CaretRight size={14} weight="bold" />
          ) : (
            <CaretDown size={14} weight="bold" />
          )}
        </button>

        <span className="flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {milestone.title}
        </span>

        {/* 进度徽章 */}
        {total > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              done === total
                ? "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
            }`}
          >
            {done}/{total}
          </span>
        )}

        <button
          onClick={() => removeMilestone(id)}
          className="shrink-0 text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-neutral-600"
          aria-label={`删除里程碑"${milestone.title}"`}
        >
          <Trash size={15} />
        </button>
      </div>

      {/* 进度条 */}
      {total > 0 && !milestone.collapsed && (
        <div className="mx-4 mb-2 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
          <div
            className="h-full rounded-full bg-pomodoro-400 transition-all"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}

      {/* 子任务列表 */}
      {!milestone.collapsed && (
        <div className="pb-3">
          <ul className="space-y-1 px-4">
            {milestone.tasks.map((task) => (
              <li key={task.id} className="group/task flex items-center gap-2">
                <button
                  onClick={() => toggleMilestoneTask(id, task.id)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    task.done
                      ? "border-green-400 bg-green-400 dark:border-green-500 dark:bg-green-500"
                      : "border-neutral-300 hover:border-pomodoro-400 dark:border-neutral-600"
                  }`}
                  aria-label={task.done ? "取消完成" : "标记完成"}
                >
                  {task.done && <Check size={10} weight="bold" className="text-white" />}
                </button>
                <span
                  className={`flex-1 text-xs ${
                    task.done
                      ? "text-neutral-400 line-through dark:text-neutral-500"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => removeMilestoneTask(id, task.id)}
                  className="opacity-0 transition-opacity group-hover/task:opacity-100"
                  aria-label={`删除"${task.title}"`}
                >
                  <Trash size={13} className="text-neutral-300 hover:text-red-400 dark:text-neutral-600" />
                </button>
              </li>
            ))}
          </ul>

          {/* 添加子任务输入框 */}
          <form onSubmit={handleAddTask} className="mt-2 flex gap-2 px-4">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="添加子任务..."
              maxLength={100}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-pomodoro-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder-neutral-600"
            />
            <button
              type="submit"
              disabled={!taskInput.trim()}
              className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-neutral-500 hover:bg-pomodoro-50 hover:text-pomodoro-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-pomodoro-500/15 dark:hover:text-pomodoro-400"
              aria-label="添加子任务"
            >
              <Plus size={14} weight="bold" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** 项目阶段目标面板 */
export function MilestonePanel() {
  const { milestones, addMilestone } = useMilestoneStore();
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMilestone(input);
    setInput("");
    setAdding(false);
  };

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
          <Flag size={14} className="mr-1.5 inline-block" weight="bold" />
          项目目标
        </h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="添加里程碑"
        >
          <Plus size={13} weight="bold" />
          添加
        </button>
      </div>

      {/* 添加里程碑输入框 */}
      {adding && (
        <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
            placeholder="阶段目标名称..."
            maxLength={80}
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-xl bg-pomodoro-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-pomodoro-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            确认
          </button>
        </form>
      )}

      {milestones.length === 0 && !adding && (
        <p className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
          添加阶段目标，把握大方向
        </p>
      )}

      <ul className="space-y-2">
        {milestones.map((m) => (
          <li key={m.id} className="group">
            <MilestoneCard id={m.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
