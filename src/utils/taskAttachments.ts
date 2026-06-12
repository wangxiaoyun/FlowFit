import { openPath } from "@tauri-apps/plugin-opener";
import type { TaskAttachment, TaskAttachmentSource } from "../types";
import { isTauri } from "./fileStorage";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);
const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "zip",
  "rar",
  "7z",
]);

const DOCUMENT_MIME_PREFIXES = [
  "application/pdf",
  "application/msword",
  "application/vnd.ms-",
  "application/vnd.openxmlformats-officedocument",
  "text/plain",
  "text/markdown",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
];

export interface CreateAttachmentRecordInput {
  id: string;
  taskId: string;
  name: string;
  mimeType: string;
  size: number;
  source: TaskAttachmentSource;
}

export function ensureAttachmentDataPath(dataPath: string): string {
  const trimmed = dataPath.trim();
  if (!trimmed) throw new Error("请先设置数据存储目录");
  return trimmed;
}

export function getFileExtension(filename: string): string {
  const lastSegment = filename.split(/[\\/]/).pop() ?? filename;
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === lastSegment.length - 1) return "";
  return lastSegment.slice(dotIndex + 1).toLowerCase();
}

export function buildAttachmentRelativePath(
  taskId: string,
  attachmentId: string,
  originalName: string,
): string {
  const ext = getFileExtension(originalName);
  const filename = ext ? `${attachmentId}.${ext}` : attachmentId;
  return `attachments/milestone-tasks/${taskId}/${filename}`;
}

export function isImageFile(name: string, mimeType: string): boolean {
  return mimeType.startsWith("image/") || IMAGE_EXTENSIONS.has(getFileExtension(name));
}

export function isSupportedDocumentFile(name: string, mimeType: string): boolean {
  const ext = getFileExtension(name);
  if (DOCUMENT_EXTENSIONS.has(ext)) return true;
  return DOCUMENT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export function isSupportedAttachmentFile(name: string, mimeType: string): boolean {
  return isImageFile(name, mimeType) || isSupportedDocumentFile(name, mimeType);
}

export function createAttachmentRecord(input: CreateAttachmentRecordInput): TaskAttachment {
  return {
    id: input.id,
    kind: isImageFile(input.name, input.mimeType) ? "image" : "document",
    name: input.name,
    mimeType: input.mimeType,
    size: input.size,
    relativePath: buildAttachmentRelativePath(input.taskId, input.id, input.name),
    source: input.source,
    createdAt: Date.now(),
  };
}

export function resolveAttachmentPath(dataPath: string, relativePath: string): string {
  const root = ensureAttachmentDataPath(dataPath);
  const sep = root.endsWith("/") || root.endsWith("\\") ? "" : "/";
  return `${root}${sep}${relativePath}`;
}

export async function writeAttachmentBytes(
  dataPath: string,
  attachment: TaskAttachment,
  bytes: Uint8Array,
): Promise<void> {
  if (!isTauri) throw new Error("附件只能在桌面端保存");
  const { mkdir, writeFile } = await import("@tauri-apps/plugin-fs");
  const fullPath = resolveAttachmentPath(dataPath, attachment.relativePath);
  const slash = Math.max(fullPath.lastIndexOf("/"), fullPath.lastIndexOf("\\"));
  const dir = slash >= 0 ? fullPath.slice(0, slash) : fullPath;
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, bytes);
}

export async function readAttachmentBytes(
  dataPath: string,
  attachment: TaskAttachment,
): Promise<Uint8Array> {
  if (!isTauri) throw new Error("附件只能在桌面端读取");
  const { readFile } = await import("@tauri-apps/plugin-fs");
  return readFile(resolveAttachmentPath(dataPath, attachment.relativePath));
}

export async function removeAttachmentFile(
  dataPath: string,
  attachment: Pick<TaskAttachment, "relativePath">,
): Promise<void> {
  if (!isTauri || !dataPath) return;
  try {
    const { exists, remove } = await import("@tauri-apps/plugin-fs");
    const fullPath = resolveAttachmentPath(dataPath, attachment.relativePath);
    if (await exists(fullPath)) await remove(fullPath);
  } catch (err) {
    console.warn("[taskAttachments] Failed to remove attachment:", err);
  }
}

export async function openAttachment(dataPath: string, attachment: TaskAttachment): Promise<void> {
  if (!isTauri) return;
  await openPath(resolveAttachmentPath(dataPath, attachment.relativePath));
}

export function generateAttachmentId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
