import { useState, useCallback, useEffect, useRef } from "react";
import { X, ArrowClockwise, Copy, Check } from "@phosphor-icons/react";
import { callDeepSeek } from "../utils/deepseek";
import { useTaskStore } from "../store/taskStore";
import { useMilestoneStore } from "../store/milestoneStore";
import { useTimerStore } from "../store/timerStore";

interface Props {
  onClose: () => void;
}

function buildWeeklyPrompt(): string {
  const tasks = useTaskStore.getState().tasks;
  const stats = useTaskStore.getState().dailyStats;
  const milestones = useMilestoneStore.getState().milestones;

  // 过去7天日期范围
  const today = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  const startDay = days[0];
  const endDay = days[6];

  // 过去7天的任务
  const weekTasks = tasks.filter((t) => t.date >= startDay && t.date <= endDay);
  const doneTasks = weekTasks.filter((t) => t.completed);
  const pendingTasks = weekTasks.filter((t) => !t.completed);

  // 番茄钟统计
  const weekStats = stats.filter((s) => s.date >= startDay && s.date <= endDay);
  const totalPomodoros = weekStats.reduce((sum, s) => sum + s.totalPomodoros, 0);
  const activeDays = weekStats.filter((s) => s.totalPomodoros > 0).length;

  // 里程碑进度（有子任务的）
  const activeMs = milestones.filter((m) => m.tasks.length > 0);

  // 拼接数据给模型
  const lines: string[] = [
    `【统计周期】${startDay} 至 ${endDay}`,
    "",
    `【番茄钟数据】`,
    `本周共完成 ${totalPomodoros} 个番茄钟，有效工作天数 ${activeDays}/7 天`,
    "",
    `【已完成任务（${doneTasks.length} 条）】`,
  ];
  if (doneTasks.length > 0) {
    doneTasks.forEach((t) => lines.push(`- [${t.date}] ${t.title}（${t.pomodoroCount} 🍅）`));
  } else {
    lines.push("- 暂无");
  }

  lines.push("", `【未完成任务（${pendingTasks.length} 条）】`);
  if (pendingTasks.length > 0) {
    pendingTasks.forEach((t) => lines.push(`- [${t.date}] ${t.title}（${t.pomodoroCount} 🍅）`));
  } else {
    lines.push("- 暂无");
  }

  if (activeMs.length > 0) {
    lines.push("", "【项目里程碑】");
    activeMs.forEach((m) => {
      const doneCount = m.tasks.filter((t) => t.done).length;
      lines.push(`- ${m.title}：完成 ${doneCount}/${m.tasks.length} 个子任务`);
    });
  }

  const dataSection = lines.join("\n");

  return `你是一名专业的工作助手。以下是我的一周工作数据，请帮我生成一份简洁的中文工作周报。

${dataSection}

要求：
1. 篇幅 300-500 字
2. 分为以下几个部分：本周总结、主要工作内容、未完成事项（如有）、下周计划建议
3. 语言专业、简洁，突出重点
4. 如果数据较少，根据已有信息合理推断，保持周报完整性
5. 直接输出周报正文，不要额外解释`;
}

/**
 * 工作周报生成弹窗。
 * 调用 DeepSeek API 根据本周任务/番茄数据生成周报，支持手动编辑后复制。
 */
export function WeeklyReportModal({ onClose }: Props) {
  const apiKey = useTimerStore((s) => s.settings.deepseekApiKey);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generate = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError("");
    setContent("");
    try {
      const prompt = buildWeeklyPrompt();
      const result = await callDeepSeek(
        apiKey,
        [{ role: "user", content: prompt }],
        { timeoutMs: 40000 }
      );
      setContent(result.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请检查 API Key 和网络");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // 打开时自动生成
  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex w-full max-w-xl flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
        style={{ maxHeight: "88vh" }}
      >
        {/* 标题栏 */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-white">
              AI 工作周报
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
              DeepSeek
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* 重新生成 */}
            <button
              onClick={generate}
              disabled={loading}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-700"
              title="重新生成"
            >
              <ArrowClockwise size={16} className={loading ? "animate-spin" : ""} />
            </button>
            {/* 复制 */}
            <button
              onClick={handleCopy}
              disabled={!content}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-700"
              title="复制全文"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          {loading && (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-neutral-400">
              <span className="animate-pulse">正在生成周报…</span>
            </div>
          )}
          {error && !loading && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
              {error}
            </div>
          )}
          {!loading && !error && (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="周报内容将在此显示，可直接编辑…"
              className="scrollbar-thin h-full min-h-[320px] w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
              style={{ minHeight: "320px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
