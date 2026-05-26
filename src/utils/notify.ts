/**
 * Multi-channel notification system.
 * Supports browser desktop notifications.
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
