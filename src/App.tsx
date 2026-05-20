import { useEffect, useState, useCallback } from "react";
import { Header } from "./components/Header";
import { TimerDisplay } from "./components/TimerDisplay";
import { StatsPanel } from "./components/StatsPanel";
import { WeekChart } from "./components/WeekChart";
import { TaskList } from "./components/TaskList";
import { MilestonePanel } from "./components/MilestonePanel";
import { NewsTickerBar } from "./components/NewsTickerBar";
import { NewsModal } from "./components/NewsModal";
import { useTimerStore } from "./store/timerStore";
import { useTaskStore } from "./store/taskStore";
import { useMilestoneStore } from "./store/milestoneStore";
import { isTauri, readDataFile } from "./utils/fileStorage";
import { saveToStorage } from "./utils/storage";
import { STORAGE_KEYS } from "./constants";
import {
  fetchAINews,
  isTodayRead,
  markTodayRead,
  type NewsItem,
} from "./utils/aiNews";
import type { Task, DailyStats, Milestone } from "./types";

/** 若设置了 dataPath，从本地 JSON 文件恢复数据到 store */
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
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  /** 弹窗是否可见 */
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  /** 当前弹窗是否是首次自动弹出（控制"已读"按钮显示） */
  const [isAutoPopup, setIsAutoPopup] = useState(false);

  const handleOpenNewsModal = useCallback(() => {
    setIsAutoPopup(false);
    setNewsModalOpen(true);
  }, []);

  const handleCloseNewsModal = useCallback(() => {
    setNewsModalOpen(false);
  }, []);

  const handleReadNews = useCallback(() => {
    markTodayRead();
    setNewsModalOpen(false);
  }, []);

  useEffect(() => {
    async function init() {
      document.documentElement.classList.remove("preload");

      // 先恢复本地文件数据
      await restoreFromDataPath();

      setLoaded(true);

      // 异步加载新闻（不阻塞主界面渲染），有 DeepSeek Key 时启用精编模式
      setNewsLoading(true);
      const apiKey = useTimerStore.getState().settings.deepseekApiKey;
      const items = await fetchAINews(apiKey || undefined);
      setNewsItems(items);
      setNewsLoading(false);

      // 今日未读则延迟500ms自动弹出
      if (!isTodayRead() && items.length > 0) {
        setTimeout(() => {
          setIsAutoPopup(true);
          setNewsModalOpen(true);
        }, 500);
      }
    }
    init();
  }, []);

  if (!loaded) return null;

  return (
    <div className="h-[100dvh] overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="flex h-full w-full flex-col px-6">
        <Header />

        {/* 顶部新闻滚动条（有数据时显示，不加载中时立即渲染） */}
        <NewsTickerBar items={newsItems} onOpen={handleOpenNewsModal} />

        <main className="flex flex-1 gap-5 overflow-hidden pb-6 pt-4">
          {/* 左列：项目目标 */}
          <div className="scrollbar-thin min-w-[200px] flex-1 overflow-y-auto">
            <MilestonePanel />
          </div>

          <div className="w-px bg-neutral-100 dark:bg-neutral-800" />

          {/* 中列：番茄钟 + 统计 + 周趋势 */}
          <div className="scrollbar-thin flex w-[296px] shrink-0 flex-col gap-6 overflow-y-auto">
            <TimerDisplay />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <StatsPanel />
            <div className="border-t border-neutral-100 dark:border-neutral-800" />
            <WeekChart />
          </div>

          <div className="w-px bg-neutral-100 dark:bg-neutral-800" />

          {/* 右列：每日任务 */}
          <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
            <TaskList />
          </div>
        </main>
      </div>

      {/* 新闻弹窗 */}
      {newsModalOpen && (
        <NewsModal
          items={newsItems}
          loading={newsLoading}
          isAutoPopup={isAutoPopup}
          onClose={handleCloseNewsModal}
          onRead={handleReadNews}
        />
      )}
    </div>
  );
}
