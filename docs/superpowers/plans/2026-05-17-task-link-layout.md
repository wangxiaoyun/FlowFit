# 任务关联番茄钟 + 双列布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在任务列表点击激活一个任务，专注结束后自动 +1 番茄计数，计时圈内显示任务名；同时把布局改为双列，所有元素一屏可见。

**Architecture:** `activeTaskId` 存入 `timerStore`，`useTimer` 在专注完成时读取并调用 `taskStore.incrementPomodoro`；`TaskList` 点击行激活/取消激活；`TimerDisplay` 在环内时间上方显示任务名胶囊；`App.tsx` 改为 `max-w-5xl` 双列布局。

**Tech Stack:** React 19, Zustand 5, TypeScript 6, Tailwind CSS 4, Vite 8

---

## 文件清单

| 文件 | 操作 | 职责变化 |
|---|---|---|
| `src/store/timerStore.ts` | 修改 | 新增 `activeTaskId` 字段和 `setActiveTask` action，`reset()` 清除激活状态 |
| `src/hooks/useTimer.ts` | 修改 | 专注完成时调用 `incrementPomodoro(activeTaskId)` |
| `src/components/TaskList.tsx` | 修改 | 任务行点击激活，激活态样式 |
| `src/components/TimerDisplay.tsx` | 修改 | 环内时间上方渲染任务名胶囊 |
| `src/App.tsx` | 修改 | 双列布局，`max-w-5xl` |

---

## Task 1: timerStore — 新增 activeTaskId

**Files:**
- Modify: `src/store/timerStore.ts`

- [ ] **Step 1: 在 TimerStore 接口加字段和 action**

打开 `src/store/timerStore.ts`，在 `interface TimerStore` 中 `updateSettings` 之前加两行：

```ts
interface TimerStore {
  phase: TimerPhase;
  status: TimerStatus;
  remaining: number;
  currentPomodoro: number;
  sessionCount: number;
  settings: Settings;
  activeTaskId: string | null;   // ← 新增

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  completePhase: () => TimerPhase;
  setPhase: (phase: TimerPhase) => void;
  setActiveTask: (id: string | null) => void;  // ← 新增
  updateSettings: (partial: Partial<Settings>) => void;
}
```

- [ ] **Step 2: 初始化 activeTaskId**

在 `create<TimerStore>((set, get) => ({` 的初始状态里，`settings: loadFromStorage(...)` 之后加：

```ts
  activeTaskId: null,
```

- [ ] **Step 3: 实现 setActiveTask action**

在 `updateSettings` 定义之前加：

```ts
  setActiveTask: (id: string | null) => set({ activeTaskId: id }),
```

- [ ] **Step 4: reset() 同时清除 activeTaskId**

将现有 `reset` 实现改为：

```ts
  reset: () => {
    const { settings } = get();
    set({
      status: "idle",
      remaining: settings.focusDuration * 60,
      phase: "focus",
      sessionCount: 0,
      activeTaskId: null,
    });
  },
```

- [ ] **Step 5: 类型检查**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && npx tsc --noEmit
```

期望输出：无错误（或仅与本次改动无关的已有警告）。

- [ ] **Step 6: 提交**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && git add src/store/timerStore.ts && git commit -m "feat: timerStore 新增 activeTaskId 状态与 setActiveTask action"
```

---

## Task 2: useTimer — 专注完成时给激活任务 +1

**Files:**
- Modify: `src/hooks/useTimer.ts`

- [ ] **Step 1: 从 timerStore 读取 activeTaskId**

在 `useTimer` 函数体内，找到这一行：

```ts
const { status, remaining, settings, tick, completePhase } = useTimerStore();
```

改为：

```ts
const { status, remaining, settings, tick, completePhase, activeTaskId } = useTimerStore();
```

- [ ] **Step 2: 从 taskStore 解构 incrementPomodoro**

找到这一行：

```ts
const { recordPomodoro } = useTaskStore();
```

改为：

```ts
const { recordPomodoro, incrementPomodoro } = useTaskStore();
```

- [ ] **Step 3: 在专注完成时调用 incrementPomodoro**

在 `useEffect` 内，找到：

```ts
      if (isFocusDone) {
        playNotification(settings.volume);
        recordPomodoro();
      } else {
```

改为：

```ts
      if (isFocusDone) {
        playNotification(settings.volume);
        recordPomodoro();
        incrementPomodoro(activeTaskId);
      } else {
```

- [ ] **Step 4: 把 activeTaskId 和 incrementPomodoro 加入 useEffect 依赖数组**

找到 `useEffect` 的依赖数组：

```ts
  }, [remaining, status, completePhase, settings, clearTick, recordPomodoro]);
```

改为：

```ts
  }, [remaining, status, completePhase, settings, clearTick, recordPomodoro, incrementPomodoro, activeTaskId]);
```

- [ ] **Step 5: 类型检查**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && npx tsc --noEmit
```

期望：无新增错误。

- [ ] **Step 6: 提交**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && git add src/hooks/useTimer.ts && git commit -m "feat: 专注完成时自动给激活任务 +1 番茄计数"
```

---

## Task 3: TaskList — 任务激活交互

**Files:**
- Modify: `src/components/TaskList.tsx`

- [ ] **Step 1: 引入 useTimerStore**

在文件顶部 import 列表加：

```ts
import { useTimerStore } from "../store/timerStore";
```

- [ ] **Step 2: 在 TaskList 组件内读取 activeTaskId 和 setActiveTask**

在 `TaskList` 函数体内，现有 `useTaskStore` 解构之后加：

```ts
  const activeTaskId = useTimerStore((s) => s.activeTaskId);
  const setActiveTask = useTimerStore((s) => s.setActiveTask);
```

- [ ] **Step 3: 实现 handleActivate 函数**

在 `handleSubmit` 定义之后加：

```ts
  const handleActivate = (id: string) => {
    setActiveTask(activeTaskId === id ? null : id);
  };
```

- [ ] **Step 4: 给今日未完成任务行加激活交互和样式**

找到 `activeTasks.map` 中的 `<li>` 元素，将其改为：

```tsx
        {activeTasks.map((task) => {
          const isActive = task.id === activeTaskId;
          return (
            <li
              key={task.id}
              onClick={() => isToday && handleActivate(task.id)}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                isActive
                  ? "border-pomodoro-300 bg-pomodoro-50 dark:border-pomodoro-600 dark:bg-pomodoro-500/10 border-l-[3px] border-l-pomodoro-500"
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
```

- [ ] **Step 5: 类型检查**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && npx tsc --noEmit
```

期望：无新增错误。

- [ ] **Step 6: 提交**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && git add src/components/TaskList.tsx && git commit -m "feat: 任务列表支持点击激活，激活态高亮"
```

---

## Task 4: TimerDisplay — 环内显示激活任务名

**Files:**
- Modify: `src/components/TimerDisplay.tsx`

- [ ] **Step 1: 从 timerStore 读取 activeTaskId**

在 `TimerDisplay` 函数体内，找到：

```ts
  const { phase, status, remaining, settings, sessionCount } = useTimerStore();
```

改为：

```ts
  const { phase, status, remaining, settings, sessionCount, activeTaskId } = useTimerStore();
```

- [ ] **Step 2: 从 taskStore 查找激活任务名**

在 `useTimerStore` 解构之后加（需在文件顶部 import 中补 `useTaskStore`）：

```ts
import { useTaskStore } from "../store/taskStore";
```

然后在组件内加：

```ts
  const activeTaskTitle = useTaskStore((s) =>
    activeTaskId ? (s.tasks.find((t) => t.id === activeTaskId)?.title ?? null) : null
  );
```

- [ ] **Step 3: 在环内时间上方渲染任务名胶囊**

找到 `CircularProgress` 内的 `children`：

```tsx
        <div className="text-center">
          <span className="font-mono text-5xl font-light tracking-tight text-neutral-900 dark:text-white sm:text-6xl">
            {timeStr}
          </span>
        </div>
```

改为：

```tsx
        <div className="flex flex-col items-center gap-1.5 text-center">
          {activeTaskTitle && (
            <span className="max-w-[160px] truncate text-xs text-neutral-500 dark:text-neutral-400">
              📌 {activeTaskTitle}
            </span>
          )}
          <span className="font-mono text-5xl font-light tracking-tight text-neutral-900 dark:text-white sm:text-6xl">
            {timeStr}
          </span>
        </div>
```

- [ ] **Step 4: 类型检查**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && npx tsc --noEmit
```

期望：无新增错误。

- [ ] **Step 5: 提交**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && git add src/components/TimerDisplay.tsx && git commit -m "feat: 计时环内显示激活任务名胶囊标签"
```

---

## Task 5: App.tsx — 双列布局

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 重写 App 布局**

将 `src/App.tsx` 全文替换为：

```tsx
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { TimerDisplay } from "./components/TimerDisplay";
import { StatsPanel } from "./components/StatsPanel";
import { WeekChart } from "./components/WeekChart";
import { TaskList } from "./components/TaskList";

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("preload");
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="min-h-[100dvh] bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-6">
        <Header />
        <main className="flex flex-1 gap-8 pb-8 pt-4">
          {/* 左列：计时器 + 统计 */}
          <div className="flex w-[380px] shrink-0 flex-col gap-8">
            <TimerDisplay />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <StatsPanel />
          </div>

          {/* 列分隔线 */}
          <div className="w-px bg-neutral-100 dark:bg-neutral-800" />

          {/* 右列：任务列表 + 周图表 */}
          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <TaskList />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <WeekChart />
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && npx tsc --noEmit
```

期望：无新增错误。

- [ ] **Step 3: 启动 dev server 视觉验收**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && npm run dev
```

在浏览器打开后验证：
- [ ] 页面宽度扩展，左列计时器 + 统计，右列任务 + 周图，无滚动条
- [ ] 点击今日任务行 → 行高亮（左边蓝色竖条 + 浅红背景），计时圈上方出现 `📌 任务名`
- [ ] 再点同一任务 → 取消激活，圈内标签消失
- [ ] 点勾选按钮只标完成，不触发激活
- [ ] 点删除按钮只删除，不触发激活
- [ ] 点重置按钮 → 激活状态清除
- [ ] 深色模式下样式正确

- [ ] **Step 4: 提交**

```bash
cd "D:\work\workspace\Pomodoro Timer\pomodoro-timer" && git add src/App.tsx && git commit -m "feat: 双列布局，左列计时器，右列任务+周图"
```

---

## 完成检查清单

- [ ] `timerStore` 有 `activeTaskId` 字段和 `setActiveTask` action，`reset()` 清除激活状态
- [ ] 专注完成时 `incrementPomodoro(activeTaskId)` 被调用
- [ ] 任务行点击可激活/取消激活，激活态有视觉区分
- [ ] 计时圈内有任务名胶囊（激活时显示，无激活时隐藏）
- [ ] 双列布局，1440×900 无需滚动
- [ ] `tsc --noEmit` 无错误
