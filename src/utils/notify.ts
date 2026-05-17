/**
 * Multi-channel notification system.
 * Supports browser desktop notifications and Feishu webhook push.
 */

// ── Desktop Notification API ────────────────────────────────────────────

/** Request permission if not yet granted. Returns true if notifications are allowed. */
export async function requestDesktopPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Send a desktop notification. No-op if permission not granted or tab has focus. */
export function sendDesktopNotification(
  title: string,
  body: string,
  options?: { icon?: string; tag?: string },
): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Don't notify if the tab/document is visible and focused
  if (document.visibilityState === "visible" && document.hasFocus()) return;

  try {
    const n = new Notification(title, {
      body,
      icon: options?.icon ?? "/favicon.svg",
      tag: options?.tag ?? "pomodoro",
      silent: true, // we handle our own sound
    });
    // Auto-close after 5 seconds
    setTimeout(() => n.close(), 5000);
  } catch {
    // silently degrade
  }
}

// ── Feishu / Lark Webhook ──────────────────────────────────────────────

/** 
 * Push a plain-text message to a Feishu bot webhook URL.
 * Returns true if the POST succeeded (HTTP 2xx).
 */
export async function sendFeishuWebhook(
  webhookUrl: string,
  text: string,
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("https://")) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "text",
        content: { text },
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** 
 * Push a rich card message to a Feishu bot webhook.
 * Falls back to text if the server doesn't support cards.
 */
export async function sendFeishuCard(
  webhookUrl: string,
  headerTitle: string,
  elements: Array<{ tag: string; text: { tag: string; content: string } }>,
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("https://")) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "interactive",
        card: {
          header: {
            title: { tag: "plain_text", content: headerTitle },
            template: "red",
          },
          elements,
        },
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
