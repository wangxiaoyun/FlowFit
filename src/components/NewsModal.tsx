import { X } from "@phosphor-icons/react";
import { openUrl as tauriOpenUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "../utils/fileStorage";
import type { NewsItem } from "../utils/aiNews";

interface Props {
  items: NewsItem[];
  loading: boolean;
  /** true = 首次自动弹出，显示"已读"按钮；false = 用户手动打开，不显示 */
  isAutoPopup: boolean;
  onClose: () => void;
  onRead: () => void;
}

async function openUrl(url: string) {
  if (isTauri) {
    try {
      await tauriOpenUrl(url);
      return;
    } catch {}
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return "";
  }
}

/**
 * AI 新闻列表弹窗。
 * isAutoPopup=true 时底部显示"已读 — 今天不再弹窗"按钮。
 */
export function NewsModal({ items, loading, isAutoPopup, onClose, onRead }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
        style={{ maxHeight: "88vh" }}
      >
        {/* 标题栏 */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-white">
              今日 AI 圈热闻
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
              Hacker News
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* 新闻列表 */}
        <div className="scrollbar-thin overflow-y-auto px-6 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-neutral-400">
              正在加载新闻…
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400">
              暂无数据，请检查网络连接后重试
            </div>
          ) : (
            <ol className="space-y-1">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className="group flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                  onClick={() => openUrl(item.url)}
                  title={item.titleEn}
                >
                  {/* 序号 */}
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      i < 3
                        ? "bg-orange-500"
                        : "bg-neutral-300 dark:bg-neutral-600"
                    }`}
                  >
                    {i + 1}
                  </span>

                  {/* 正文 */}
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-neutral-800 group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400">
                      {item.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-neutral-400 dark:text-neutral-500">
                      <span>{item.source}</span>
                      {item.publishedAt && (
                        <>
                          <span>·</span>
                          <span>{formatDate(item.publishedAt)}</span>
                        </>
                      )}
                      {item.points > 0 && (
                        <>
                          <span>·</span>
                          <span>▲ {item.points}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* 已读按钮（仅首次自动弹窗时显示） */}
        {isAutoPopup && (
          <div className="shrink-0 border-t border-neutral-100 px-6 py-4 dark:border-neutral-700">
            <button
              onClick={onRead}
              className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              已读 — 今天不再弹窗
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
