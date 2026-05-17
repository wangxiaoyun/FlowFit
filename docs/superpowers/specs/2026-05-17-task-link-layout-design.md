# 任务关联番茄钟 + 双列布局重构

**日期：** 2026-05-17  
**状态：** 已批准，待实现

---

## 背景

v1.1 已有任务列表和番茄计数，但二者相互独立：完成一个番茄不会自动给正在处理的任务 +1，用户需手动记录。同时，单列布局在常规屏幕上需要滚动才能看到任务列表。

本次迭代目标：

1. 任务可被"激活"为当前专注对象，番茄完成时自动 +1
2. 计时圈内显示激活任务名（上方胶囊标签）
3. 双列布局，所有元素一屏可见，无需滚动

---

## 数据层

### timerStore 改动

新增字段：
```ts
activeTaskId: string | null  // 当前关联任务 id，null = 无关联
```

新增 action：
```ts
setActiveTask: (id: string | null) => void
```

`reset()` 同时将 `activeTaskId` 清为 `null`。

### useTimer 改动

专注阶段完成时，在调用 `recordPomodoro()` 之后追加：
```ts
useTaskStore.getState().incrementPomodoro(activeTaskId)
```
`incrementPomodoro` 已做空值保护（id 为 null 时直接返回），可安全调用。

---

## UI 层

### TimerDisplay

`CircularProgress` 内部，时间数字**上方**新增任务标签行：

- 有激活任务时显示：`📌 任务名`（最多 14 字，超出截断加 `…`）
- 无激活任务时此行不渲染，环内保持原样
- 样式：`text-xs text-neutral-500 dark:text-neutral-400`

### TaskList

激活交互（仅今日未完成任务支持）：

- **点击任务行主体** → 激活该任务（`setActiveTask(id)`），同时取消其他任务激活态
- **再次点击已激活任务** → 取消激活（`setActiveTask(null)`）
- **激活态样式**：左边缘竖条 `border-l-2 border-pomodoro-500` + 背景 `bg-pomodoro-50 dark:bg-pomodoro-500/10`
- 已完成任务、历史日期任务不可激活
- 计时运行中允许切换激活任务（下一个番茄生效）
- 计时器 `reset()` 后激活状态自动清除

---

## 布局重构

### 整体结构

页面扩至 `max-w-5xl`，Header 横跨全宽，main 区改为双列：

```
┌────────────────────────────────────────────────────┐
│  Header（全宽）                                     │
├─────────────────────┬──────────────────────────────┤
│  左列（~380px 固定） │  右列（flex-1）               │
│                     │                              │
│  TimerDisplay       │  TaskList（含日期 Tab）        │
│  ─────────────────  │  ─────────────────────────── │
│  StatsPanel         │  WeekChart                   │
│                     │                              │
└─────────────────────┴──────────────────────────────┘
```

- 左列：`w-[380px] shrink-0`，垂直排列 TimerDisplay + StatsPanel
- 右列：`flex-1 min-w-0`，垂直排列 TaskList + WeekChart
- 列间距：`gap-8`
- 整体 padding：`px-6 py-6`

### 目标效果

1440×900 及以上分辨率下所有元素一屏可见，无垂直滚动条。

---

## 不在本次范围内

- 番茄历史时间线（每个番茄的开始/结束时间）
- 专注全屏模式
- 任务预估番茄数设置
