/**
 * AI 新闻获取、翻译与缓存模块。
 * 数据源：Hacker News Algolia API（免费无 Key）
 * 翻译/精选：
 *   - 配置了 DeepSeek API Key → DeepSeek 翻译+写中文摘要（精编版）
 *   - 未配置 → Google Translate 非官方接口（基础翻译版）
 */

import { callDeepSeek } from "./deepseek";

export interface NewsItem {
  id: string;
  title: string;     // 中文标题（翻译/精编后）
  titleEn: string;   // 英文原标题
  summary?: string;  // 一句话中文摘要（DeepSeek 模式才有）
  url: string;
  source: string;    // 域名
  publishedAt: string;
  points: number;
}

interface NewsCache {
  date: string;
  mode: "deepseek" | "google" | "raw"; // 记录生成模式，Key 变化时强制刷新
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

/** Google Translate 非官方接口批量翻译（换行合并，一次请求） */
async function translateTitles(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];
  const encoded = encodeURIComponent(titles.join("\n"));
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encoded}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) throw new Error("translate failed");
    const json = await resp.json();
    const translated: string = (json[0] as Array<[string]>)
      .map((seg) => seg[0])
      .join("");
    const lines = translated.split("\n");
    return titles.map((_, i) => lines[i]?.trim() || titles[i]);
  } catch {
    return titles; // fallback 英文
  }
}

/** DeepSeek 精编：翻译+写一句话摘要，返回 { title, summary }[] */
async function enrichWithDeepSeek(
  apiKey: string,
  hits: Array<{ title: string; url: string }>
): Promise<Array<{ title: string; summary: string }>> {
  const numbered = hits
    .map((h, i) => `${i + 1}. ${h.title}`)
    .join("\n");

  const prompt = `你是AI科技新闻编辑。以下是从Hacker News获取的今日AI相关英文新闻标题，请：
1. 将每条标题翻译为准确、简洁的中文
2. 为每条新闻写一句话中文摘要（15-35字，说明核心内容）

严格以JSON数组格式输出，不要其他文字：
[{"title":"中文标题","summary":"一句话摘要"},...]

新闻列表：
${numbered}`;

  const raw = await callDeepSeek(
    apiKey,
    [{ role: "user", content: prompt }],
    { timeoutMs: 25000 }
  );

  // 提取 JSON（防止模型包裹 markdown 代码块）
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid JSON from DeepSeek");
  const parsed = JSON.parse(match[0]) as Array<{ title: string; summary: string }>;
  return hits.map((_, i) => ({
    title: parsed[i]?.title ?? hits[i].title,
    summary: parsed[i]?.summary ?? "",
  }));
}

/** 从 HN Algolia API 获取 AI 相关原始故事 */
async function fetchRawFromHN(): Promise<Array<{ id: string; title: string; url: string; publishedAt: string; points: number }>> {
  const resp = await fetch(
    "https://hn.algolia.com/api/v1/search" +
      "?query=artificial+intelligence+LLM+GPT" +
      "&tags=story&hitsPerPage=15&page=0",
    { signal: AbortSignal.timeout(10000) }
  );
  if (!resp.ok) throw new Error("HN fetch failed");
  const data = await resp.json();

  return (data.hits as Record<string, unknown>[])
    .filter((h) => h.title && (h.url || h.objectID))
    .slice(0, 10)
    .map((h) => {
      const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      return {
        id: String(h.objectID),
        title: String(h.title),
        url: typeof h.url === "string" ? h.url : hnUrl,
        publishedAt: String(h.created_at ?? new Date().toISOString()),
        points: typeof h.points === "number" ? h.points : 0,
      };
    });
}

/**
 * 获取今日 AI 新闻。
 * deepseekApiKey 有值时：DeepSeek 精编（含摘要）；否则 Google 翻译基础版。
 * 当天同模式缓存有效，切换 Key 或跨天自动刷新。
 */
export async function fetchAINews(deepseekApiKey?: string): Promise<NewsItem[]> {
  const today = todayStr();
  const mode: NewsCache["mode"] = deepseekApiKey ? "deepseek" : "google";

  // 读缓存（同天且同模式才命中）
  let cached: NewsCache | null = null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw) as NewsCache;
  } catch {}
  if (cached?.date === today && cached.mode === mode && cached.items.length > 0) {
    return cached.items;
  }

  // 拉取原始数据
  let raw: Awaited<ReturnType<typeof fetchRawFromHN>>;
  try {
    raw = await fetchRawFromHN();
  } catch {
    return cached?.items ?? [];
  }
  if (raw.length === 0) return cached?.items ?? [];

  let items: NewsItem[];

  if (deepseekApiKey) {
    // DeepSeek 精编模式
    try {
      const enriched = await enrichWithDeepSeek(deepseekApiKey, raw);
      items = raw.map((h, i) => ({
        id: h.id,
        title: enriched[i].title || h.title,
        titleEn: h.title,
        summary: enriched[i].summary,
        url: h.url,
        source: extractDomain(h.url),
        publishedAt: h.publishedAt,
        points: h.points,
      }));
    } catch {
      // DeepSeek 失败降级为 Google 翻译
      const translated = await translateTitles(raw.map((h) => h.title));
      items = raw.map((h, i) => ({
        ...h,
        title: translated[i] || h.title,
        titleEn: h.title,
        source: extractDomain(h.url),
      }));
    }
  } else {
    // Google 翻译基础模式
    const translated = await translateTitles(raw.map((h) => h.title));
    items = raw.map((h, i) => ({
      ...h,
      title: translated[i] || h.title,
      titleEn: h.title,
      source: extractDomain(h.url),
    }));
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, mode, items }));
  return items;
}

export function isTodayRead(): boolean {
  return localStorage.getItem(READ_KEY) === todayStr();
}

export function markTodayRead(): void {
  localStorage.setItem(READ_KEY, todayStr());
}
