/**
 * AI 新闻获取、翻译与缓存模块。
 * 数据源：Hacker News Algolia API（免费无 Key）
 * 翻译：Google Translate 非官方接口（无需 Key，失败时保留英文）
 */

export interface NewsItem {
  id: string;
  title: string;     // 中文翻译标题（翻译失败时为英文）
  titleEn: string;   // 英文原标题
  url: string;
  source: string;    // 域名，如 techcrunch.com
  publishedAt: string;
  points: number;
}

interface NewsCache {
  date: string;
  items: NewsItem[];
}

const CACHE_KEY = "ai-news-cache";
const READ_KEY = "ai-news-read-date";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "news.ycombinator.com";
  }
}

/** 用 Google Translate 非官方接口批量翻译，titles 换行分隔，一次请求 */
async function translateTitles(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];
  const joined = titles.join("\n");
  const encoded = encodeURIComponent(joined);
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encoded}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) throw new Error("translate failed");
    const json = await resp.json();
    // 返回结构：[[["译文", "原文", null, null, 1], ...], ...]
    // 合并所有分段文本
    const translated: string = (json[0] as Array<[string]>)
      .map((seg) => seg[0])
      .join("");
    const lines = translated.split("\n");
    // 按行数对应回 titles（Google 可能合并短行）
    return titles.map((_, i) => lines[i]?.trim() || titles[i]);
  } catch {
    // 翻译失败时返回原始英文
    return titles;
  }
}

/** 从 HN Algolia API 获取 AI 相关热门故事 */
async function fetchFromHN(): Promise<NewsItem[]> {
  const resp = await fetch(
    "https://hn.algolia.com/api/v1/search" +
      "?query=artificial+intelligence+LLM+GPT" +
      "&tags=story&hitsPerPage=12&page=0",
    { signal: AbortSignal.timeout(10000) }
  );
  if (!resp.ok) throw new Error("HN fetch failed");
  const data = await resp.json();

  // 过滤掉没有标题或 URL 的条目，取前10条
  const hits = (data.hits as Record<string, unknown>[])
    .filter((h) => h.title && (h.url || h.objectID))
    .slice(0, 10);

  const englishTitles = hits.map((h) => String(h.title));
  const chineseTitles = await translateTitles(englishTitles);

  return hits.map((h, i) => {
    const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
    const url = typeof h.url === "string" ? h.url : hnUrl;
    return {
      id: String(h.objectID),
      title: chineseTitles[i] || englishTitles[i],
      titleEn: englishTitles[i],
      url,
      source: extractDomain(url),
      publishedAt: String(h.created_at ?? new Date().toISOString()),
      points: typeof h.points === "number" ? h.points : 0,
    };
  });
}

/**
 * 获取今日 AI 新闻。
 * 当天有缓存则直接返回；否则从 HN 拉取 + 翻译并写入缓存。
 * 网络失败时返回上次缓存（如有），再失败则返回空数组。
 */
export async function fetchAINews(): Promise<NewsItem[]> {
  const today = todayStr();

  // 读取缓存
  let cached: NewsCache | null = null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw) as NewsCache;
  } catch {}

  if (cached?.date === today && cached.items.length > 0) {
    return cached.items;
  }

  // 拉取新数据
  try {
    const items = await fetchFromHN();
    if (items.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, items }));
      return items;
    }
  } catch {}

  // 网络失败：返回上次旧缓存
  return cached?.items ?? [];
}

/** 今日是否已点击"已读" */
export function isTodayRead(): boolean {
  return localStorage.getItem(READ_KEY) === todayStr();
}

/** 标记今日已读（今天不再自动弹出） */
export function markTodayRead(): void {
  localStorage.setItem(READ_KEY, todayStr());
}
