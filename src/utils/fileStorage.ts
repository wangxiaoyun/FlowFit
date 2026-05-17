/**
 * Tauri 文件系统存储工具。
 * 在 Tauri 桌面端环境中，将数据额外写入本地 JSON 文件作为持久化备份。
 * 在普通浏览器环境中，所有函数为空操作（no-op）。
 */

/** 检测当前是否运行在 Tauri 桌面端 */
export const isTauri: boolean =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * 将数据异步写入 dataPath 目录下的指定 JSON 文件。
 * 写入失败时静默忽略（不抛出，不影响 UI 流程）。
 */
export async function writeDataFile(
  dataPath: string,
  filename: string,
  data: unknown,
): Promise<void> {
  if (!isTauri || !dataPath) return;
  try {
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const sep = dataPath.endsWith("/") || dataPath.endsWith("\\") ? "" : "/";
    await writeTextFile(`${dataPath}${sep}${filename}`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn(`[fileStorage] Failed to write ${filename}:`, err);
  }
}

/**
 * 弹出系统文件夹选择对话框（Tauri dialog 插件），返回用户选择的路径。
 * 非 Tauri 环境下返回 null。
 */
export async function selectDirectory(): Promise<string | null> {
  if (!isTauri) return null;
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const result = await open({ directory: true, multiple: false, title: "选择数据存储目录" });
    return typeof result === "string" ? result : null;
  } catch (err) {
    console.warn("[fileStorage] Failed to open directory dialog:", err);
    return null;
  }
}
