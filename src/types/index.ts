/** Timer session phase */
export type TimerPhase = "focus" | "break" | "longBreak";

/** Timer running state */
export type TimerStatus = "idle" | "running" | "paused";

/** A single pomodoro task */
export interface Task {
  id: string;
  title: string;
  pomodoroCount: number;
  completed: boolean;
  createdAt: number;
  date: string; // YYYY-MM-DD，任务所属日期
}

/** Daily statistics snapshot */
export interface DailyStats {
  date: string;          // YYYY-MM-DD
  totalPomodoros: number;
  completedTasks: number;
}

/** Application settings */
export interface Settings {
  focusDuration: number;   // minutes
  breakDuration: number;   // minutes
  longBreakDuration: number;
  longBreakInterval: number; // every N pomodoros
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  theme: "light" | "dark" | "system";
  soundEnabled: boolean;
  volume: number;           // 0-1
  desktopNotify: boolean;   // browser Notification API
  feishuWebhook: string;    // Feishu bot webhook URL (empty = disabled)
}

/** Timer store state */
export interface TimerState {
  phase: TimerPhase;
  status: TimerStatus;
  remaining: number;        // seconds
  currentPomodoro: number;  // consecutive count in current session
  settings: Settings;
}

/** Task store state */
export interface TaskState {
  tasks: Task[];
  dailyStats: DailyStats[];
}
