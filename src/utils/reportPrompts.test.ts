import { beforeEach, describe, expect, it } from "vitest";
import { useMilestoneStore } from "../store/milestoneStore";
import { useTaskStore } from "../store/taskStore";
import { buildDailyData, buildWeeklyData } from "./reportPrompts";

beforeEach(() => {
  useTaskStore.setState({
    tasks: [
      {
        id: "task-1",
        title: "完成支付模块联调",
        pomodoroCount: 3,
        completed: true,
        createdAt: 1,
        date: "2026-05-20",
      },
      {
        id: "task-2",
        title: "整理发布清单",
        pomodoroCount: 1,
        completed: false,
        createdAt: 2,
        date: "2026-05-21",
      },
      {
        id: "task-3",
        title: "历史数据迁移复盘",
        pomodoroCount: 2,
        completed: true,
        createdAt: 3,
        date: "2026-05-18",
      },
    ],
    dailyStats: [
      { date: "2026-05-20", totalPomodoros: 3, completedTasks: 1 },
      { date: "2026-05-21", totalPomodoros: 1, completedTasks: 0 },
      { date: "2026-05-18", totalPomodoros: 2, completedTasks: 1 },
    ],
  });

  useMilestoneStore.setState({
    milestones: [
      {
        id: "milestone-1",
        title: "移动端结算体验优化",
        collapsed: false,
        createdAt: 1,
        tasks: [
          { id: "m-task-1", title: "确认埋点", done: true, createdAt: 1 },
          { id: "m-task-2", title: "灰度发布", done: false, createdAt: 2 },
        ],
      },
    ],
  });
});

describe("report prompt builders", () => {
  it("builds daily and weekly prompts without tomato-related wording or symbols", () => {
    const daily = buildDailyData("2026-05-20");
    const weekly = buildWeeklyData({ start: "2026-05-20", end: "2026-05-21" });

    expect(daily.prompt).not.toMatch(/番茄|🍅/);
    expect(weekly.prompt).not.toMatch(/番茄|🍅/);
  });

  it("builds weekly reports from the selected date range", () => {
    const weekly = buildWeeklyData({ start: "2026-05-20", end: "2026-05-21" });

    expect(weekly.period).toBe("2026-05-20~2026-05-21");
    expect(weekly.rawData.tasks.map((task) => task.title)).toEqual([
      "完成支付模块联调",
      "整理发布清单",
    ]);
    expect(weekly.rawData.totalPomodoros).toBe(4);
    expect(weekly.rawData.activeDays).toBe(2);
    expect(weekly.prompt).toContain("统计周期】2026-05-20 至 2026-05-21");
    expect(weekly.prompt).not.toContain("历史数据迁移复盘");
  });
});
