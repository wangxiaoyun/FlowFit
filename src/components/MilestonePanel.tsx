import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CaretDown,
  CaretRight,
  Check,
  DotsSixVertical,
  Flag,
  Paperclip,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import type { MilestoneTask } from "../types";
import { useMilestoneStore } from "../store/milestoneStore";
import { useTaskStore } from "../store/taskStore";
import { useTimerStore } from "../store/timerStore";
import { MilestoneTaskDetailDrawer } from "./MilestoneTaskDetailDrawer";

interface SelectedTask {
  milestoneId: string;
  taskId: string;
}

function MilestoneCard({
  id,
  isDragging,
  onTitleBarPointerDown,
  onOpenTask,
}: {
  id: string;
  isDragging?: boolean;
  onTitleBarPointerDown?: (e: React.PointerEvent) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const {
    milestones,
    removeMilestone,
    toggleCollapse,
    addMilestoneTask,
    removeMilestoneTask,
    toggleMilestoneTask,
    updateTaskCompletedAt,
  } = useMilestoneStore();
  const addTask = useTaskStore((s) => s.addTask);
  const milestone = milestones.find((m) => m.id === id);
  const [taskInput, setTaskInput] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeVal, setEditingTimeVal] = useState("");

  if (!milestone) return null;

  const done = milestone.tasks.filter((t) => t.done).length;
  const total = milestone.tasks.length;

  const handleAddTask = (event: React.FormEvent) => {
    event.preventDefault();
    addMilestoneTask(id, taskInput);
    setTaskInput("");
  };

  const handleAddToPomodoro = (taskId: string, title: string) => {
    addTask(title);
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      setTimeout(() => {
        setAddedIds((current) => {
          const updated = new Set(current);
          updated.delete(taskId);
          return updated;
        });
      }, 1500);
      return next;
    });
  };

  const startEditTime = (event: React.MouseEvent, task: MilestoneTask) => {
    event.stopPropagation();
    setEditingTimeId(task.id);
    setEditingTimeVal(task.completedAt ?? "");
  };

  const saveEditTime = (taskId: string) => {
    updateTaskCompletedAt(id, taskId, editingTimeVal.trim());
    setEditingTimeId(null);
  };

  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white transition-opacity dark:border-neutral-700 dark:bg-neutral-800 ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <div
        className="relative flex cursor-grab items-center gap-2 rounded-t-xl px-3 py-3 transition-colors hover:bg-neutral-100 active:cursor-grabbing dark:hover:bg-white/8"
        title="拖拽调整优先级"
        onPointerDown={onTitleBarPointerDown}
      >
        <div className="shrink-0 select-none text-neutral-500 opacity-0 transition-opacity group-hover/milestone:opacity-100 dark:text-neutral-400">
          <DotsSixVertical size={15} weight="bold" />
        </div>

        <button
          onClick={() => toggleCollapse(id)}
          onPointerDown={(event) => event.stopPropagation()}
          className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label={milestone.collapsed ? "展开目标" : "折叠目标"}
        >
          {milestone.collapsed ? (
            <CaretRight size={14} weight="bold" />
          ) : (
            <CaretDown size={14} weight="bold" />
          )}
        </button>

        <span className="flex-1 select-none text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {milestone.title}
        </span>

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
          onPointerDown={(event) => event.stopPropagation()}
          className="shrink-0 text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover/milestone:opacity-100 dark:text-neutral-600"
          aria-label={`删除目标 ${milestone.title}`}
        >
          <Trash size={15} />
        </button>
      </div>

      {total > 0 && !milestone.collapsed && (
        <div className="mx-4 mb-2 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
          <div
            className="h-full rounded-full bg-pomodoro-400 transition-all"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}

      {!milestone.collapsed && (
        <div className="pb-3">
          <ul className="space-y-1.5 px-4">
            {milestone.tasks.map((task) => {
              const added = addedIds.has(task.id);
              const isEditingTime = editingTimeId === task.id;
              const attachmentCount = task.attachments?.length ?? 0;
              return (
                <li key={task.id} className="group/task">
                  <div
                    onClick={() => onOpenTask(task.id)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/70"
                    title="点击查看子任务详情"
                  >
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleMilestoneTask(id, task.id);
                      }}
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
                      className={`min-w-0 flex-1 text-xs ${
                        task.done
                          ? "text-neutral-400 line-through dark:text-neutral-500"
                          : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {task.title}
                    </span>

                    {attachmentCount > 0 && (
                      <span className="flex items-center gap-0.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:bg-neutral-700 dark:text-neutral-400">
                        <Paperclip size={10} weight="bold" />
                        {attachmentCount}
                      </span>
                    )}

                    {!task.done && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddToPomodoro(task.id, task.title);
                        }}
                        className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] opacity-0 transition-all group-hover/task:opacity-100 ${
                          added
                            ? "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
                            : "text-neutral-400 hover:bg-pomodoro-50 hover:text-pomodoro-600 dark:hover:bg-pomodoro-500/10 dark:hover:text-pomodoro-400"
                        }`}
                        aria-label={`将 ${task.title} 加入今日任务`}
                        title="加入今日番茄任务"
                      >
                        {added ? <Check size={10} weight="bold" /> : <ArrowRight size={10} weight="bold" />}
                        {added ? "已添加" : "加入任务"}
                      </button>
                    )}

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        removeMilestoneTask(id, task.id);
                      }}
                      className="opacity-0 transition-opacity group-hover/task:opacity-100"
                      aria-label={`删除 ${task.title}`}
                    >
                      <Trash size={13} className="text-neutral-300 hover:text-red-400 dark:text-neutral-600" />
                    </button>
                  </div>

                  {task.done && (
                    <div className="mt-0.5 flex items-center gap-1 pl-7">
                      {isEditingTime ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingTimeVal}
                          onChange={(event) => setEditingTimeVal(event.target.value)}
                          onBlur={() => saveEditTime(task.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveEditTime(task.id);
                            if (event.key === "Escape") setEditingTimeId(null);
                          }}
                          className="w-full rounded border border-pomodoro-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 focus:outline-none dark:border-pomodoro-700 dark:bg-neutral-900 dark:text-neutral-400"
                          placeholder="yyyy-MM-dd HH:mm:ss"
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        <button
                          className="cursor-text font-mono text-[10px] text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400"
                          title="点击编辑完成时间"
                          onClick={(event) => startEditTime(event, task)}
                        >
                          {task.completedAt ?? "-"}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <form onSubmit={handleAddTask} className="mt-2 flex gap-2 px-4">
            <input
              type="text"
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
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

export function MilestonePanel() {
  const { milestones, addMilestone, reorderMilestones } = useMilestoneStore();
  const dataPath = useTimerStore((s) => s.settings.dataPath);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragFromRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  const selected = useMemo(() => {
    if (!selectedTask) return null;
    const milestone = milestones.find((item) => item.id === selectedTask.milestoneId);
    const task = milestone?.tasks.find((item) => item.id === selectedTask.taskId);
    return milestone && task ? { milestone, task } : null;
  }, [milestones, selectedTask]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    addMilestone(input);
    setInput("");
    setAdding(false);
  };

  const startDrag = (event: React.PointerEvent, index: number) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    dragFromRef.current = index;
    overIndexRef.current = index;
    setDragIndex(index);
    setOverIndex(index);

    const onMove = (moveEvent: PointerEvent) => {
      const valid = itemsRef.current.filter(Boolean) as HTMLLIElement[];
      if (valid.length === 0) return;

      const firstRect = valid[0].getBoundingClientRect();
      if (moveEvent.clientY < firstRect.top) {
        overIndexRef.current = 0;
        setOverIndex(0);
        return;
      }

      const lastRect = valid[valid.length - 1].getBoundingClientRect();
      if (moveEvent.clientY > lastRect.bottom) {
        const last = valid.length - 1;
        overIndexRef.current = last;
        setOverIndex(last);
        return;
      }

      for (let i = 0; i < itemsRef.current.length; i++) {
        const el = itemsRef.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (moveEvent.clientY >= rect.top && moveEvent.clientY <= rect.bottom) {
          overIndexRef.current = i;
          setOverIndex(i);
          break;
        }
      }
    };

    const onUp = () => {
      const from = dragFromRef.current;
      const to = overIndexRef.current;
      if (from !== null && to !== null && from !== to) reorderMilestones(from, to);
      dragFromRef.current = null;
      overIndexRef.current = null;
      setDragIndex(null);
      setOverIndex(null);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
          <Flag size={14} className="mr-1.5 inline-block" weight="bold" />
          项目目标
        </h2>
        <button
          onClick={() => setAdding((value) => !value)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="添加目标"
        >
          <Plus size={13} weight="bold" />
          添加
        </button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setAdding(false)}
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
        {milestones.map((milestone, index) => (
          <li
            key={milestone.id}
            ref={(el) => {
              itemsRef.current[index] = el;
            }}
            className="group/milestone relative"
          >
            {overIndex === index && dragIndex !== null && dragIndex !== index && (
              <div className="pointer-events-none absolute -top-1 inset-x-0 z-10 h-0.5 rounded-full bg-pomodoro-500" />
            )}
            <MilestoneCard
              id={milestone.id}
              isDragging={dragIndex === index}
              onTitleBarPointerDown={(event) => startDrag(event, index)}
              onOpenTask={(taskId) => setSelectedTask({ milestoneId: milestone.id, taskId })}
            />
          </li>
        ))}
      </ul>

      {selected && (
        <MilestoneTaskDetailDrawer
          milestone={selected.milestone}
          task={selected.task}
          dataPath={dataPath}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </section>
  );
}
