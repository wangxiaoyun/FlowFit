import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { TimerDisplay } from "./components/TimerDisplay";
import { StatsPanel } from "./components/StatsPanel";
import { WeekChart } from "./components/WeekChart";
import { TaskList } from "./components/TaskList";
import { MilestonePanel } from "./components/MilestonePanel";
import { useTimerStore } from "./store/timerStore";
import { useTaskStore } from "./store/taskStore";
import { useMilestoneStore } from "./store/milestoneStore";
import { isTauri, readDataFile } from "./utils/fileStorage";
import { saveToStorage } from "./utils/storage";
import { STORAGE_KEYS } from "./constants";
import type { Task, DailyStats, Milestone } from "./types";

/**
 * 若设置了 dataPath，从本地 JSON 文件恢复数据到 store。
 * 以文件为权威来源，覆盖 localStorage（处理重装后数据丢失的场景）。
 */
async function restoreFromDataPath(): Promise<void> {
  const { dataPath } = useTimerStore.getState().settings;
  if (!dataPath || !isTauri) return;

  const [tasks, stats, milestones] = await Promise.all([
    readDataFile<Task[] | null>(dataPath, "pomodoro-tasks.json", null),
    readDataFile<DailyStats[] | null>(dataPath, "pomodoro-stats.json", null),
    readDataFile<Milestone[] | null>(dataPath, "pomodoro-milestones.json", null),
  ]);

  if (tasks !== null) {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    useTaskStore.setState({ tasks });
  }
  if (stats !== null) {
    saveToStorage(STORAGE_KEYS.STATS, stats);
    useTaskStore.setState({ dailyStats: stats });
  }
  if (milestones !== null) {
    saveToStorage(STORAGE_KEYS.MILESTONES, milestones);
    useMilestoneStore.setState({ milestones });
  }
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      document.documentElement.classList.remove("preload");
      // 数据恢复完成后再显示 UI，避免显示旧数据再闪烁到新数据
      await restoreFromDataPath();
      setLoaded(true);
    }
    init();
  }, []);

  if (!loaded) return null;

  return (
    <div className="h-[100dvh] overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="flex h-full w-full flex-col px-6">
        <Header />
        <main className="flex flex-1 gap-5 overflow-hidden pb-6 pt-4">
          {/* 左列：项目目标（自适应宽度，最小 200px） */}
          <div className="scrollbar-thin min-w-[200px] flex-1 overflow-y-auto">
            <MilestonePanel />
          </div>

          {/* 列分隔线 */}
          <div className="w-px bg-neutral-100 dark:bg-neutral-800" />

          {/* 中列：番茄钟 + 统计 + 周趋势（可独立滚动） */}
          <div className="scrollbar-thin flex w-[296px] shrink-0 flex-col gap-6 overflow-y-auto">
            <TimerDisplay />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <StatsPanel />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <WeekChart />
          </div>

          {/* 列分隔线 */}
          <div className="w-px bg-neutral-100 dark:bg-neutral-800" />

          {/* 右列：每日任务（可独立滚动） */}
          <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
            <TaskList />
          </div>
        </main>
      </div>
    </div>
  );
}
