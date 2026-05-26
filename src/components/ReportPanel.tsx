import { useState, useCallback, useRef } from "react";
import {
  X,
  ArrowClockwise,
  Copy,
  Check,
  Trash,
  CalendarBlank,
  CalendarDots,
  Plus,
} from "@phosphor-icons/react";
import { callDeepSeek } from "../utils/deepseek";
import { useTimerStore } from "../store/timerStore";
import { useReportStore } from "../store/reportStore";
import {
  buildDailyData,
  buildWeeklyData,
  todayStr,
  weekRange,
} from "../utils/reportPrompts";
import type { Report } from "../types";

interface Props {
  onClose: () => void;
}

type GeneratingType = "daily" | "weekly" | null;

export function ReportPanel({ onClose }: Props) {
  const apiKey = useTimerStore((s) => s.settings.deepseekApiKey);
  const { reports, addReport, updateReport, deleteReport } = useReportStore();
  const [selectedId, setSelectedId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );
  const [generating, setGenerating] = useState<GeneratingType>(null);
  const [genError, setGenError] = useState("");
  const [copied, setCopied] = useState(false);
  const [weeklyStart, setWeeklyStart] = useState(() => weekRange().start);
  const [weeklyEnd, setWeeklyEnd] = useState(() => weekRange().end);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedReport = reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;
  const effectiveSelectedId = selectedReport?.id ?? null;
  const weeklyRangeInvalid = weeklyStart > weeklyEnd;

  const generate = useCallback(
    async (type: "daily" | "weekly") => {
      if (!apiKey) return;
      if (type === "weekly" && weeklyRangeInvalid) {
        setGenError("请选择有效的周报日期范围");
        return;
      }
      setGenerating(type);
      setGenError("");
      try {
        let prompt: string;
        let rawData: Report["rawData"];
        let period: string;

        if (type === "daily") {
          const today = todayStr();
          const result = buildDailyData(today);
          prompt = result.prompt;
          rawData = result.rawData;
          period = today;
        } else {
          const result = buildWeeklyData({ start: weeklyStart, end: weeklyEnd });
          prompt = result.prompt;
          rawData = result.rawData;
          period = result.period;
        }

        const content = await callDeepSeek(
          apiKey,
          [{ role: "user", content: prompt }],
          { timeoutMs: 40000 }
        );

        const now = new Date().toISOString();
        const report: Report = {
          id: `${type}-${Date.now()}`,
          type,
          period,
          content: content.trim(),
          rawData,
          createdAt: now,
          updatedAt: now,
        };
        addReport(report);
        setSelectedId(report.id);
      } catch (e) {
        setGenError(e instanceof Error ? e.message : "生成失败，请检查 API Key 和网络");
      } finally {
        setGenerating(null);
      }
    },
    [apiKey, addReport, weeklyEnd, weeklyRangeInvalid, weeklyStart]
  );

  const handleCopy = useCallback(async () => {
    if (!selectedReport?.content) return;
    await navigator.clipboard.writeText(selectedReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedReport]);

  const handleDelete = useCallback(() => {
    if (!selectedReport) return;
    deleteReport(selectedReport.id);
    const next = reports.find((r) => r.id !== selectedReport.id);
    setSelectedId(next?.id ?? null);
  }, [selectedReport, reports, deleteReport]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
        style={{ height: "82vh" }}
      >
        {/* 标题栏 */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-white">
              日报 / 周报管理
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
              DeepSeek
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* 生成今日日报 */}
            <button
              onClick={() => generate("daily")}
              disabled={!apiKey || generating !== null}
              title="生成今日日报"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
            >
              {generating === "daily" ? (
                <ArrowClockwise size={13} className="animate-spin" />
              ) : (
                <CalendarBlank size={13} />
              )}
              今日日报
            </button>
            <button
              onClick={onClose}
              className="ml-1 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-100 px-5 py-3 text-xs dark:border-neutral-700">
          <span className="font-medium text-neutral-600 dark:text-neutral-300">
            周报范围
          </span>
          <input
            type="date"
            value={weeklyStart}
            onChange={(e) => setWeeklyStart(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-neutral-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          />
          <span className="text-neutral-400">至</span>
          <input
            type="date"
            value={weeklyEnd}
            onChange={(e) => setWeeklyEnd(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-neutral-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          />
          <button
            onClick={() => generate("weekly")}
            disabled={!apiKey || generating !== null || weeklyRangeInvalid}
            title={
              weeklyRangeInvalid
                ? "请选择有效的周报日期范围"
                : `生成周报（${weeklyStart}~${weeklyEnd}）`
            }
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
          >
            {generating === "weekly" ? (
              <ArrowClockwise size={13} className="animate-spin" />
            ) : (
              <CalendarDots size={13} />
            )}
            生成周报
          </button>
        </div>

        {/* 未配置 API Key 提示 */}
        {!apiKey && (
          <div className="mx-5 mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
            请先在设置中配置 DeepSeek API Key，才能生成报告。
          </div>
        )}

        {/* 生成失败提示 */}
        {genError && (
          <div className="mx-5 mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
            {genError}
          </div>
        )}

        {/* 主体：左侧列表 + 右侧编辑器 */}
        <div className="flex min-h-0 flex-1">
          {/* 左侧报告列表 */}
          <div className="scrollbar-thin w-44 shrink-0 overflow-y-auto border-r border-neutral-100 py-2 dark:border-neutral-700">
            {reports.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                <Plus size={20} className="opacity-40" />
                <span>点击上方按钮生成第一份报告</span>
              </div>
            ) : (
              reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
                    effectiveSelectedId === r.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {r.type === "daily" ? (
                      <CalendarBlank
                        size={12}
                        className="shrink-0 text-blue-500"
                      />
                    ) : (
                      <CalendarDots
                        size={12}
                        className="shrink-0 text-purple-500"
                      />
                    )}
                    <span className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-200">
                      {r.type === "daily" ? "日报" : "周报"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
                    {r.period}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 右侧编辑器 */}
          <div className="flex min-w-0 flex-1 flex-col px-5 py-4">
            {generating !== null && !selectedReport ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-neutral-400">
                <ArrowClockwise size={16} className="animate-spin" />
                <span>正在生成…</span>
              </div>
            ) : selectedReport ? (
              <>
                {/* 报告头部 */}
                <div className="mb-3 flex shrink-0 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-neutral-800 dark:text-white">
                      {selectedReport.type === "daily" ? "工作日报" : "工作周报"}
                    </span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {selectedReport.period}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* 重新生成 */}
                    <button
                      onClick={() => generate(selectedReport.type)}
                      disabled={
                        !apiKey ||
                        generating !== null ||
                        (selectedReport.type === "weekly" && weeklyRangeInvalid)
                      }
                      className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-700"
                      title="重新生成"
                    >
                      <ArrowClockwise
                        size={15}
                        className={generating !== null ? "animate-spin" : ""}
                      />
                    </button>
                    {/* 复制 */}
                    <button
                      onClick={handleCopy}
                      className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      title="复制全文"
                    >
                      {copied ? (
                        <Check size={15} className="text-green-500" />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                    {/* 删除 */}
                    <button
                      onClick={handleDelete}
                      className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-700"
                      title="删除"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>

                {/* 可编辑文本区 */}
                <textarea
                  ref={textareaRef}
                  value={selectedReport.content}
                  onChange={(e) =>
                    updateReport(selectedReport.id, e.target.value)
                  }
                  className="scrollbar-thin flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                />

                <p className="mt-2 shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                  最后更新：
                  {new Date(selectedReport.updatedAt).toLocaleString("zh-CN")}
                </p>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500">
                <CalendarDots size={32} className="opacity-30" />
                <p className="text-sm">从左侧选择一份报告，或生成新报告</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
