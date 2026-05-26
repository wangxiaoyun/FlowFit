import type { NewsItem } from "../utils/aiNews";

interface Props {
  items: NewsItem[];
  onOpen: () => void;
}

/**
 * 顶部 AI 新闻无限滚动条。
 * 内容复制两份实现无缝循环（translateX 0 → -50%）。
 * 鼠标悬停时暂停，点击任意位置打开新闻列表弹窗。
 */
export function NewsTickerBar({ items, onOpen }: Props) {
  if (items.length === 0) return null;

  // 将标题拼接成一串，间距用全角空格隔开
  const tickerText = items
    .map((item, i) => `${i + 1}. ${item.title}`)
    .join("\u3000\u3000\u3000\u3000");

  return (
    <div
      className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 bg-white py-1.5 dark:border-neutral-800 dark:bg-neutral-950"
      onClick={onOpen}
      title="点击查看今日 AI 热闻"
    >
      {/* 来源标签 */}
      <span className="shrink-0 rounded bg-blue-500 px-1.5 py-0.5 text-xs font-medium text-white">
        AI 热闻
      </span>

      {/* 滚动区域：overflow hidden + 无缝双份内容 */}
      <div className="flex-1 overflow-hidden">
        <div className="animate-ticker inline-block whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400">
          {/* 两份内容：第一份滚完后无缝衔接第二份（translateX -50%） */}
          <span>{tickerText}{"\u3000\u3000\u3000\u3000\u3000\u3000"}</span>
          <span>{tickerText}{"\u3000\u3000\u3000\u3000\u3000\u3000"}</span>
        </div>
      </div>

      {/* 点击提示 */}
      <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
        点击查看 →
      </span>
    </div>
  );
}
