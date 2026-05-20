import { useRef, useState } from "react";
import {
  Plus,
  Trash,
  Check,
  CaretDown,
  CaretRight,
  Flag,
  ArrowRight,
  DotsSixVertical,
} from "@phosphor-icons/react";
import { useMilestoneStore } from "../store/milestoneStore";
import { useTaskStore } from "../store/taskStore";

/** 单个里程碑卡片，含折叠/展开、子任务管理 */
function MilestoneCard({
  id,
  isDragging,
  onTitleBarPointerDown,
}: {
  id: string;
  isDragging?: boolean;
  /** 标题行按下时触发拖拽（排除按钮区域后由调用方传入） */
  onTitleBarPointerDown?: (e: React.PointerEvent) => void;
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
  // 正在内联编辑完成时间的任务 id 及临时值
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeVal, setEditingTimeVal] = useState("");

  if (!milestone) return null;

  const done = milestone.tasks.filter((t) => t.done).length;
  const total = milestone.tasks.length;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    addMilestoneTask(id, taskInput);
    setTaskInput("");
  };

  const handleAddToPomodoro = (taskId: string, title: string) => {
    addTask(title);
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      setTimeout(() => {
        setAddedIds((s) => {
          const ns = new Set(s);
          ns.delete(taskId);
          return ns;
        });
      }, 1500);
      return next;
    });
  };

  const startEditTime = (taskId: string, val: string) => {
    setEditingTimeId(taskId);
    setEditingTimeVal(val);
  };

  const saveEditTime = (milestoneId: string, taskId: string) => {
    if (editingTimeVal.trim()) {
      updateTaskCompletedAt(milestoneId, taskId, editingTimeVal.trim());
    }
    setEditingTimeId(null);
  };

  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white transition-opacity dark:border-neutral-700 dark:bg-neutral-800 ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      {/* 标题行：整行可拖拽（排除按钮区域），hover 时背景 + 左侧竖线 + 把手图标同步显现 */}
      <div
        className="relative flex cursor-grab items-center gap-2 rounded-t-xl px-3 py-3 transition-colors hover:bg-neutral-100 active:cursor-grabbing dark:hover:bg-white/8"
        title="拖拽调整优先级"
        onPointerDown={onTitleBarPointerDown}
      >
        {/* 左侧可拖拽提示竖线，hover 时显现 */}
        <div className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full bg-transparent transition-colors group-hover/milestone:bg-pomodoro-300 dark:group-hover/milestone:bg-pomodoro-700" />

        {/* 把手图标：hover 时从隐藏变为清晰可见 */}
        <div className="shrink-0 select-none text-neutral-500 opacity-0 transition-opacity group-hover/milestone:opacity-100 dark:text-neutral-400">
          <DotsSixVertical size={15} weight="bold" />
        </div>

        <button
          onClick={() => toggleCollapse(id)}
          onPointerDown={(e) => e.stopPropagation()} // 阻止触发拖拽
          className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label={milestone.collapsed ? "展开" : "折叠"}
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
          onPointerDown={(e) => e.stopPropagation()} // 阻止触发拖拽
          className="shrink-0 text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover/milestone:opacity-100 dark:text-neutral-600"
          aria-label={`删除里程碑"${milestone.title}"`}
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
              return (
                <li key={task.id} className="group/task">
                  <div className="flex items-center gap-2">
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
                    {!task.done && (
                      <button
                        onClick={() => handleAddToPomodoro(task.id, task.title)}
                        className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] opacity-0 transition-all group-hover/task:opacity-100 ${
                          added
                            ? "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
                            : "text-neutral-400 hover:bg-pomodoro-50 hover:text-pomodoro-600 dark:hover:bg-pomodoro-500/10 dark:hover:text-pomodoro-400"
                        }`}
                        aria-label={`将"${task.title}"加入今日任务`}
                        title="加入今日番茄任务"
                      >
                        {added ? <Check size={10} weight="bold" /> : <ArrowRight size={10} weight="bold" />}
                        {added ? "已添加" : "加入任务"}
                      </button>
                    )}
                    <button
                      onClick={() => removeMilestoneTask(id, task.id)}
                      className="opacity-0 transition-opacity group-hover/task:opacity-100"
                      aria-label={`删除"${task.title}"`}
                    >
                      <Trash size={13} className="text-neutral-300 hover:text-red-400 dark:text-neutral-600" />
                    </button>
                  </div>

                  {/* 完成时间行：已完成任务才显示 */}
                  {task.done && (
                    <div className="mt-0.5 flex items-center gap-1 pl-6">
                      {isEditingTime ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingTimeVal}
                          onChange={(e) => setEditingTimeVal(e.target.value)}
                          onBlur={() => saveEditTime(id, task.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditTime(id, task.id);
                            if (e.key === "Escape") setEditingTimeId(null);
                          }}
                          className="w-full rounded border border-pomodoro-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 focus:outline-none dark:border-pomodoro-700 dark:bg-neutral-900 dark:text-neutral-400"
                          placeholder="yyyy-MM-dd HH:mm:ss"
                        />
                      ) : (
                        <span
                          className="cursor-text font-mono text-[10px] text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400"
                          title="点击编辑完成时间"
                          onClick={() => startEditTime(task.id, task.completedAt ?? "")}
                        >
                          {task.completedAt ?? "—"}
                        </span>
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

/** 项目阶段目标面板，支持 Pointer Events 拖拽排序（兼容 Tauri WebView） */
export function MilestonePanel() {
  const { milestones, addMilestone, reorderMilestones } = useMilestoneStore();
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragFromRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMilestone(input);
    setInput("");
    setAdding(false);
  };

  /**
   * 标题行按下时启动拖拽。
   * 使用 setPointerCapture 保证鼠标移出元素后事件仍路由到此处，
   * 同时在 document 监听 pointermove/pointerup 计算目标位置。
   */
  const startDrag = (e: React.PointerEvent, index: number) => {
    // 只响应主键（左键/触摸），忽略右键等
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    // 捕获 pointer，防止移出时丢失事件
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragFromRef.current = index;
    overIndexRef.current = index;
    setDragIndex(index);
    setOverIndex(index);

    const onMove = (ev: PointerEvent) => {
      const items = itemsRef.current;
      const valid = items.filter(Boolean) as HTMLLIElement[];
      if (valid.length === 0) return;

      const firstRect = valid[0].getBoundingClientRect();
      if (ev.clientY < firstRect.top) {
        overIndexRef.current = 0;
        setOverIndex(0);
        return;
      }
      const lastRect = valid[valid.length - 1].getBoundingClientRect();
      if (ev.clientY > lastRect.bottom) {
        const last = valid.length - 1;
        overIndexRef.current = last;
        setOverIndex(last);
        return;
      }
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
          overIndexRef.current = i;
          setOverIndex(i);
          break;
        }
      }
    };

    const onUp = () => {
      const from = dragFromRef.current;
      const to = overIndexRef.current;
      if (from !== null && to !== null && from !== to) {
        reorderMilestones(from, to);
      }
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
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="添加里程碑"
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
        {milestones.map((m, i) => (
          <li
            key={m.id}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="group/milestone relative"
          >
            {overIndex === i && dragIndex !== null && dragIndex !== i && (
              <div className="pointer-events-none absolute -top-1 inset-x-0 z-10 h-0.5 rounded-full bg-pomodoro-500" />
            )}
            <MilestoneCard
              id={m.id}
              isDragging={dragIndex === i}
              onTitleBarPointerDown={(e) => startDrag(e, i)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
