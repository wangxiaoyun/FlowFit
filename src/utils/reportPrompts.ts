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
    `【番茄钟】今日完成 ${totalPomodoros} 个`,
    "",
    `【已完成任务（${done.length} 条）】`,
  ];
  if (done.length > 0) {
    done.forEach((t) => lines.push(`- ${t.title}（${t.pomodoroCount} 🍅）`));
  } else {
    lines.push("- 暂无");
  }
  lines.push("", `【未完成任务（${pending.length} 条）】`);
  if (pending.length > 0) {
    pending.forEach((t) => lines.push(`- ${t.title}（${t.pomodoroCount} 🍅）`));
  } else {
    lines.push("- 暂无");
  }

  const dataSection = lines.join("\n");

  const prompt = `你是一名专业的工作助手。以下是我今天的工作数据，请帮我生成一份简洁的中文工作日报。

${dataSection}

要求：
1. 篇幅 150-250 字
2. 分为以下几个部分：今日工作总结、完成事项、待处理事项（如有）、明日计划建议
3. 语言专业、简洁，突出重点
4. 如果数据较少，根据已有信息合理推断，保持日报完整性
5. 直接输出日报正文，不要额外解释`;

  return { rawData, prompt };
}

/** 构建本周周报的数据快照和 prompt */
export function buildWeeklyData(): {
  rawData: ReportRawData;
  prompt: string;
  period: string;
} {
  const { start, end } = weekRange();
  const tasks = useTaskStore.getState().tasks;
  const stats = useTaskStore.getState().dailyStats;
  const milestones = useMilestoneStore.getState().milestones;

  const weekTasks = tasks.filter((t) => t.date >= start && t.date <= end);
  const done = weekTasks.filter((t) => t.completed);
  const pending = weekTasks.filter((t) => !t.completed);

  const weekStats = stats.filter((s) => s.date >= start && s.date <= end);
  const totalPomodoros = weekStats.reduce((sum, s) => sum + s.totalPomodoros, 0);
  const activeDays = weekStats.filter((s) => s.totalPomodoros > 0).length;

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
    `【番茄钟数据】本周共完成 ${totalPomodoros} 个，有效工作天数 ${activeDays}/7 天`,
    "",
    `【已完成任务（${done.length} 条）】`,
  ];
  if (done.length > 0) {
    done.forEach((t) => lines.push(`- [${t.date}] ${t.title}（${t.pomodoroCount} 🍅）`));
  } else {
    lines.push("- 暂无");
  }
  lines.push("", `【未完成任务（${pending.length} 条）】`);
  if (pending.length > 0) {
    pending.forEach((t) => lines.push(`- [${t.date}] ${t.title}（${t.pomodoroCount} 🍅）`));
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

  const prompt = `你是一名专业的工作助手。以下是我的一周工作数据，请帮我生成一份简洁的中文工作周报。

${dataSection}

要求：
1. 篇幅 300-500 字
2. 分为以下几个部分：本周总结、主要工作内容、未完成事项（如有）、下周计划建议
3. 语言专业、简洁，突出重点
4. 如果数据较少，根据已有信息合理推断，保持周报完整性
5. 直接输出周报正文，不要额外解释`;

  return { rawData, prompt, period: `${start}~${end}` };
}
