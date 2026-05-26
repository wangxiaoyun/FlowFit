import { useTaskStore } from "../store/taskStore";
import { useMilestoneStore } from "../store/milestoneStore";
import type { ReportRawData } from "../types";

function padDate(n: number) {
  return String(n).padStart(2, "0");
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${padDate(d.getMonth() + 1)}-${padDate(d.getDate())}`;
}

/** 今日日期字符串 */
export function todayStr(): string {
  return dateStr(new Date());
}

/** 本周日期范围（过去7天）*/
export function weekRange(): { start: string; end: string; days: string[] } {
  const today = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(dateStr(d));
  }
  return { start: days[0], end: days[6], days };
}

export interface ReportDateRange {
  start: string;
  end: string;
}

function countRangeDays(start: string, end: string): number {
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) {
    return 0;
  }
  return Math.floor((endTime - startTime) / 86400000) + 1;
}

/** 构建今日日报的数据快照和 prompt */
export function buildDailyData(date: string): {
  rawData: ReportRawData;
  prompt: string;
} {
  const tasks = useTaskStore.getState().tasks;
  const stats = useTaskStore.getState().dailyStats;

  const dayTasks = tasks.filter((t) => t.date === date);
  const done = dayTasks.filter((t) => t.completed);
  const pending = dayTasks.filter((t) => !t.completed);

  const dayStat = stats.find((s) => s.date === date);
  const totalPomodoros = dayStat?.totalPomodoros ?? 0;

  const rawData: ReportRawData = {
    tasks: dayTasks.map((t) => ({
      title: t.title,
      completed: t.completed,
      pomodoroCount: t.pomodoroCount,
      date: t.date,
    })),
    totalPomodoros,
  };

  const lines: string[] = [
    `【日期】${date}`,
    "",
    `【工作概况】今日记录 ${dayTasks.length} 项任务，已完成 ${done.length} 项，待处理 ${pending.length} 项`,
    "",
    `【已完成任务（${done.length} 条）】`,
  ];
  if (done.length > 0) {
    done.forEach((t) => lines.push(`- ${t.title}`));
  } else {
    lines.push("- 暂无");
  }
  lines.push("", `【未完成任务（${pending.length} 条）】`);
  if (pending.length > 0) {
    pending.forEach((t) => lines.push(`- ${t.title}`));
  } else {
    lines.push("- 暂无");
  }

  const dataSection = lines.join("\n");

  const prompt = `你是一名专业的项目工作助手。以下是我今天的项目工作记录，请帮我生成一份简洁的中文工作日报。

${dataSection}

要求：
1. 篇幅 150-250 字
2. 分为以下几个部分：今日工作总结、完成事项、待处理事项（如有）、明日计划建议
3. 语言专业、简洁，突出重点
4. 如果数据较少，根据已有信息合理推断，保持日报完整性
5. 直接输出日报正文，不要额外解释`;

  return { rawData, prompt };
}

/** 构建周报的数据快照和 prompt */
export function buildWeeklyData(range: ReportDateRange = weekRange()): {
  rawData: ReportRawData;
  prompt: string;
  period: string;
} {
  const { start, end } = range;
  const tasks = useTaskStore.getState().tasks;
  const stats = useTaskStore.getState().dailyStats;
  const milestones = useMilestoneStore.getState().milestones;

  const weekTasks = tasks.filter((t) => t.date >= start && t.date <= end);
  const done = weekTasks.filter((t) => t.completed);
  const pending = weekTasks.filter((t) => !t.completed);

  const weekStats = stats.filter((s) => s.date >= start && s.date <= end);
  const totalPomodoros = weekStats.reduce((sum, s) => sum + s.totalPomodoros, 0);
  const activeDates = new Set([
    ...weekTasks.map((t) => t.date),
    ...weekStats.filter((s) => s.totalPomodoros > 0).map((s) => s.date),
  ]);
  const activeDays = activeDates.size;
  const rangeDays = countRangeDays(start, end);

  const activeMs = milestones.filter((m) => m.tasks.length > 0);

  const rawData: ReportRawData = {
    tasks: weekTasks.map((t) => ({
      title: t.title,
      completed: t.completed,
      pomodoroCount: t.pomodoroCount,
      date: t.date,
    })),
    totalPomodoros,
    activeDays,
    milestones: activeMs.map((m) => ({
      title: m.title,
      doneCount: m.tasks.filter((t) => t.done).length,
      totalCount: m.tasks.length,
    })),
  };

  const lines: string[] = [
    `【统计周期】${start} 至 ${end}`,
    "",
    `【工作概况】期间记录 ${weekTasks.length} 项任务，已完成 ${done.length} 项，待处理 ${pending.length} 项，有工作记录 ${activeDays}/${rangeDays} 天`,
    "",
    `【已完成任务（${done.length} 条）】`,
  ];
  if (done.length > 0) {
    done.forEach((t) => lines.push(`- [${t.date}] ${t.title}`));
  } else {
    lines.push("- 暂无");
  }
  lines.push("", `【未完成任务（${pending.length} 条）】`);
  if (pending.length > 0) {
    pending.forEach((t) => lines.push(`- [${t.date}] ${t.title}`));
  } else {
    lines.push("- 暂无");
  }
  if (activeMs.length > 0) {
    lines.push("", "【项目里程碑】");
    activeMs.forEach((m) => {
      const dc = m.tasks.filter((t) => t.done).length;
      lines.push(`- ${m.title}：完成 ${dc}/${m.tasks.length} 个子任务`);
    });
  }

  const dataSection = lines.join("\n");

  const prompt = `你是一名专业的项目工作助手。以下是指定周期内的项目工作记录，请帮我生成一份简洁的中文工作周报。

${dataSection}

要求：
1. 篇幅 300-500 字
2. 分为以下几个部分：周期总结、主要进展、风险与待办（如有）、下阶段计划建议
3. 语言专业、简洁，突出重点
4. 如果数据较少，根据已有信息合理推断，保持周报完整性
5. 直接输出周报正文，不要额外解释`;

  return { rawData, prompt, period: `${start}~${end}` };
}
