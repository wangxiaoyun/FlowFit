import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { TimerDisplay } from "./components/TimerDisplay";
import { StatsPanel } from "./components/StatsPanel";
import { WeekChart } from "./components/WeekChart";
import { TaskList } from "./components/TaskList";
import { MilestonePanel } from "./components/MilestonePanel";

export default function App() {
  const [loaded, setLoaded] = useState(false);

  // Remove preload class after mount so transitions work
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
          <div className="flex w-[320px] shrink-0 flex-col gap-8">
            <TimerDisplay />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <StatsPanel />
          </div>

          {/* 列分隔线 */}
          <div className="w-px bg-neutral-100 dark:bg-neutral-800" />

          {/* 右列：项目目标 + 任务列表 + 周图表 */}
          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <MilestonePanel />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <TaskList />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <WeekChart />
          </div>
        </main>
      </div>
    </div>
  );
}
