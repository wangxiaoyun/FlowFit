import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { TimerDisplay } from "./components/TimerDisplay";
import { StatsPanel } from "./components/StatsPanel";
import { TaskList } from "./components/TaskList";

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
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-4 sm:px-6">
        <Header />
        <main className="flex flex-1 flex-col items-center gap-8 pb-12 pt-4 sm:pt-8">
          {/* Timer section */}
          <TimerDisplay />

          {/* Divider */}
          <div className="w-full border-t border-neutral-100 dark:border-neutral-800" />

          {/* Stats and Tasks */}
          <div className="flex w-full flex-col gap-8">
            <StatsPanel />
            <TaskList />
          </div>
        </main>
      </div>
    </div>
  );
}
