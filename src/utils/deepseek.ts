/**
 * DeepSeek API 工具模块（兼容 OpenAI Chat Completions 格式）。
 * Base URL: https://api.deepseek.com
 * 模型默认使用 deepseek-chat（DeepSeek-V3）
 */

const BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 调用 DeepSeek Chat Completions，返回助手回复文本 */
export async function callDeepSeek(
  apiKey: string,
  messages: ChatMessage[],
  options?: { timeoutMs?: number; model?: string }
): Promise<string> {
  const { timeoutMs = 30000, model = DEFAULT_MODEL } = options ?? {};
  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => resp.statusText);
    throw new Error(`DeepSeek API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return String(data.choices[0].message.content ?? "");
}

/** 快速测试 API Key 是否有效（发送最短请求） */
export async function testDeepSeekKey(apiKey: string): Promise<boolean> {
  try {
    await callDeepSeek(
      apiKey,
      [{ role: "user", content: "hi" }],
      { timeoutMs: 8000 }
    );
    return true;
  } catch {
    return false;
  }
}
