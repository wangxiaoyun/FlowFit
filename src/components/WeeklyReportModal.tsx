import { useState, useCallback, useEffect, useRef } from "react";
import { X, ArrowClockwise, Copy, Check } from "@phosphor-icons/react";
import { callDeepSeek } from "../utils/deepseek";
import { useTimerStore } from "../store/timerStore";
import { buildWeeklyData } from "../utils/reportPrompts";

interface Props {
  onClose: () => void;
}

function buildWeeklyPrompt(): string {
  return buildWeeklyData().prompt;
}

/**
 * 工作周报生成弹窗。
 * 调用 DeepSeek API 根据本周项目工作记录生成周报，支持手动编辑后复制。
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
    const id = window.setTimeout(() => {
      void generate();
    }, 0);
    return () => window.clearTimeout(id);
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
