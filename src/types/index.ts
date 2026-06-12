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
  date: string; // YYYY-MM-DD
}

/** Daily statistics snapshot */
export interface DailyStats {
  date: string;          // YYYY-MM-DD
  totalPomodoros: number;
  completedTasks: number;
}

/** Application settings */
export type RestActivityType = "stretch" | "breathing" | "pelvicFloor" | "none";

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
  dataPath: string;         // local data directory; empty means localStorage only
  /** Pelvic-floor activity settings */
  kegelEnabled: boolean;
  kegelReps: number;
  kegelHoldSeconds: number;
  /** Post-focus rest activity preference */
  restPreferenceSet: boolean;
  restActivityType: RestActivityType;
  /** DeepSeek API key; empty means report generation is disabled */
  deepseekApiKey: string;
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

/** Raw data snapshot stored with each report (for future WBS generation) */
export interface ReportRawData {
  tasks: Array<{
    title: string;
    completed: boolean;
    pomodoroCount: number;
    date: string;
  }>;
  totalPomodoros: number;
  activeDays?: number;
  milestones?: Array<{ title: string; doneCount: number; totalCount: number }>;
}

/** A generated daily or weekly report */
export interface Report {
  id: string;
  type: "daily" | "weekly";
  /** Daily report: "2026-05-20"; weekly report: "2026-05-18~2026-05-24" */
  period: string;
  content: string;
  rawData: ReportRawData;
  createdAt: string;
  updatedAt: string;
}

/** A persisted attachment associated with a task-like record. */
export type TaskAttachmentKind = "image" | "document";
export type TaskAttachmentSource = "paste" | "upload";

export interface TaskAttachment {
  id: string;
  kind: TaskAttachmentKind;
  name: string;
  mimeType: string;
  size: number;
  relativePath: string;
  source: TaskAttachmentSource;
  createdAt: number;
}

/** A single task within a milestone */
export interface MilestoneTask {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  completedAt?: string; // yyyy-MM-dd HH:mm:ss
  description?: string;
  attachments?: TaskAttachment[];
}

/** A project milestone / phase goal */
export interface Milestone {
  id: string;
  title: string;
  tasks: MilestoneTask[];
  collapsed: boolean;
  createdAt: number;
}
