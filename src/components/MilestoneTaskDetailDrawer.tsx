import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder as editorPlaceholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import type { Milestone, MilestoneTask, TaskAttachment } from "../types";
import { useMilestoneStore } from "../store/milestoneStore";
import {
  createAttachmentRecord,
  generateAttachmentId,
  isImageFile,
  isSupportedAttachmentFile,
  openAttachment,
  readAttachmentBytes,
  writeAttachmentBytes,
} from "../utils/taskAttachments";
import { isTauri } from "../utils/fileStorage";

interface Props {
  milestone: Milestone;
  task: MilestoneTask;
  dataPath: string;
  onClose: () => void;
}

function filenameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || "attachment";
}

function inferMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "md":
      return "text/markdown";
    case "txt":
      return "text/plain";
    case "zip":
      return "application/zip";
    case "rar":
      return "application/vnd.rar";
    case "7z":
      return "application/x-7z-compressed";
    default:
      return "";
  }
}

function imageNameFromFile(file: File, index: number): string {
  if (file.name && file.name.includes(".")) return file.name;
  const ext = file.type.split("/")[1] || "png";
  return `pasted-image-${index + 1}.${ext === "jpeg" ? "jpg" : ext}`;
}

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function toBlobPart(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

const markdownEditorTheme = EditorView.theme({
  "&": {
    minHeight: "420px",
    height: "100%",
    border: "1px solid rgb(229 229 229)",
    borderRadius: "0.75rem",
    backgroundColor: "rgb(250 250 250)",
    color: "rgb(23 23 23)",
    fontSize: "14px",
  },
  "&.cm-focused": {
    outline: "none",
    borderColor: "rgb(251 113 133)",
    boxShadow: "0 0 0 2px rgb(251 113 133 / 0.2)",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    lineHeight: "1.625",
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "0.5rem 0.75rem",
    caretColor: "rgb(244 63 94)",
  },
  ".cm-line": {
    padding: "0",
  },
  ".cm-gutters": {
    borderRight: "1px solid rgb(229 229 229)",
    backgroundColor: "rgb(245 245 245)",
    color: "rgb(163 163 163)",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "rgb(244 244 245)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgb(251 113 133 / 0.22)",
  },
  ".cm-placeholder": {
    color: "rgb(163 163 163)",
  },
});

const markdownSyntaxHighlight = HighlightStyle.define([
  { tag: tags.heading1, color: "#be123c", fontWeight: "700" },
  { tag: tags.heading2, color: "#e11d48", fontWeight: "700" },
  { tag: tags.heading3, color: "#f43f5e", fontWeight: "600" },
  { tag: tags.strong, color: "#7c2d12", fontWeight: "700" },
  { tag: tags.emphasis, color: "#a16207", fontStyle: "italic" },
  { tag: tags.link, color: "#2563eb", textDecoration: "underline" },
  { tag: tags.url, color: "#0284c7" },
  { tag: tags.quote, color: "#16a34a", fontStyle: "italic" },
  { tag: tags.monospace, color: "#9333ea", backgroundColor: "rgb(243 232 255 / 0.65)" },
  { tag: tags.keyword, color: "#db2777" },
  { tag: tags.atom, color: "#0891b2" },
  { tag: tags.punctuation, color: "#737373" },
  { tag: tags.processingInstruction, color: "#64748b" },
]);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.lineWrapping,
          editorPlaceholder(placeholder),
          markdownEditorTheme,
          syntaxHighlighting(markdownSyntaxHighlight),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue === value) return;
    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
  }, [value]);

  return (
    <div
      ref={hostRef}
      className="min-h-[420px] flex-1 overflow-hidden rounded-xl"
      data-markdown-editor="codemirror"
      aria-label="Markdown editor"
    />
  );
}

function MarkdownPreview({ value, className = "" }: { value: string; className?: string }) {
  const blocks = useMemo(() => renderMarkdownBlocks(value), [value]);
  return (
    <div
      className={`overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 ${className}`}
    >
      {blocks.length > 0 ? blocks : <p className="text-neutral-400">暂无内容</p>}
    </div>
  );
}

function renderMarkdownBlocks(value: string): ReactNode[] {
  const lines = value.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCode = false;

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems.map((item, index) => (
      <li key={`li-${blocks.length}-${index}`}>{item}</li>
    ));
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="mb-3 list-disc space-y-1 pl-5">
        {items}
      </ul>,
    );
    listItems = [];
  };

  const flushCode = () => {
    blocks.push(
      <pre
        key={`code-${blocks.length}`}
        className="mb-3 overflow-x-auto rounded-lg bg-neutral-900 px-3 py-2 text-xs text-neutral-100"
      >
        {codeLanguage && (
          <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-400">
            {codeLanguage}
          </div>
        )}
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
    codeLanguage = "";
  };

  lines.forEach((line) => {
    const codeFence = line.match(/^```(\w+)?\s*$/);
    if (codeFence) {
      if (inCode) {
        inCode = false;
        flushCode();
      } else {
        flushList();
        inCode = true;
        codeLanguage = codeFence[1] ?? "";
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!line.trim()) {
      flushList();
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const className =
        level === 1
          ? "mb-2 text-base font-semibold"
          : level === 2
            ? "mb-2 text-sm font-semibold"
            : "mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500";
      blocks.push(
        <div key={`h-${blocks.length}`} className={className}>
          {heading[2]}
        </div>,
      );
      return;
    }

    const list = line.match(/^[-*]\s+(.+)$/);
    if (list) {
      listItems.push(list[1]);
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="mb-3 whitespace-pre-wrap">
        {line}
      </p>,
    );
  });

  if (inCode) flushCode();
  flushList();
  return blocks;
}

export function MilestoneTaskDetailDrawer({ milestone, task, dataPath, onClose }: Props) {
  const updateDetails = useMilestoneStore((s) => s.updateMilestoneTaskDetails);
  const addAttachment = useMilestoneStore((s) => s.addMilestoneTaskAttachment);
  const removeAttachment = useMilestoneStore((s) => s.removeMilestoneTaskAttachment);
  const [descriptionMode, setDescriptionMode] = useState<"edit" | "preview">("edit");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = useMemo(() => task.attachments ?? [], [task.attachments]);
  const imageAttachments = useMemo(
    () => attachments.filter((item) => item.kind === "image"),
    [attachments],
  );
  const documentAttachments = useMemo(
    () => attachments.filter((item) => item.kind === "document"),
    [attachments],
  );
  const selectedImage = useMemo(
    () => imageAttachments.find((attachment) => attachment.id === selectedImageId),
    [imageAttachments, selectedImageId],
  );
  const selectedImageUrl = selectedImageId ? previewUrls[selectedImageId] : "";
  const canUseAttachments = Boolean(dataPath.trim());

  useEffect(() => {
    if (selectedImageId && !selectedImage) {
      setSelectedImageId(null);
    }
  }, [selectedImage, selectedImageId]);

  useEffect(() => {
    let cancelled = false;
    const urls: Record<string, string> = {};

    async function loadPreviews() {
      if (!canUseAttachments) {
        setPreviewUrls({});
        return;
      }
      await Promise.all(
        imageAttachments.map(async (attachment) => {
          try {
            const bytes = await readAttachmentBytes(dataPath, attachment);
            const blob = new Blob([toBlobPart(bytes)], { type: attachment.mimeType || "image/png" });
            urls[attachment.id] = URL.createObjectURL(blob);
          } catch {
            urls[attachment.id] = "";
          }
        }),
      );
      if (!cancelled) setPreviewUrls(urls);
    }

    loadPreviews();
    return () => {
      cancelled = true;
      Object.values(urls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [canUseAttachments, dataPath, imageAttachments]);

  const saveAttachment = async (
    name: string,
    mimeType: string,
    bytes: Uint8Array,
    source: "paste" | "upload",
  ) => {
    if (!canUseAttachments) throw new Error("请先设置数据存储目录");
    if (!isSupportedAttachmentFile(name, mimeType)) {
      throw new Error(`不支持的附件类型：${name}`);
    }
    const attachment = createAttachmentRecord({
      id: generateAttachmentId(),
      taskId: task.id,
      name,
      mimeType,
      size: bytes.byteLength,
      source,
    });
    await writeAttachmentBytes(dataPath, attachment, bytes);
    addAttachment(milestone.id, task.id, attachment);
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.files).filter((file) =>
      isImageFile(file.name, file.type),
    );
    if (files.length === 0) return;
    event.preventDefault();
    setError("");
    try {
      for (const [index, file] of files.entries()) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        await saveAttachment(imageNameFromFile(file, index), file.type || "image/png", bytes, "paste");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片粘贴失败");
    }
  };

  const handleBrowserFiles = async (files: FileList | null) => {
    if (!files) return;
    setError("");
    for (const file of Array.from(files)) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        await saveAttachment(file.name, file.type || inferMimeType(file.name), bytes, "upload");
      } catch (err) {
        setError(err instanceof Error ? err.message : "附件上传失败");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!canUseAttachments) {
      setError("请先设置数据存储目录");
      return;
    }
    setError("");
    if (!isTauri) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readFile } = await import("@tauri-apps/plugin-fs");
      const result = await open({
        multiple: true,
        title: "选择附件",
        filters: [
          {
            name: "常用附件",
            extensions: [
              "png",
              "jpg",
              "jpeg",
              "gif",
              "webp",
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
            ],
          },
        ],
      });
      const paths = Array.isArray(result) ? result : result ? [result] : [];
      for (const path of paths) {
        try {
          const name = filenameFromPath(path);
          const bytes = await readFile(path);
          await saveAttachment(name, inferMimeType(name), bytes, "upload");
        } catch (err) {
          setError(err instanceof Error ? err.message : "附件上传失败");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "附件上传失败");
    }
  };

  const handleRemoveAttachment = (attachment: TaskAttachment) => {
    removeAttachment(milestone.id, task.id, attachment.id);
  };

  const updateTitle = (title: string) => {
    updateDetails(milestone.id, task.id, { title });
  };

  const description = task.description ?? "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${
        isFullscreen ? "p-0" : "p-4"
      }`}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onPaste={handlePaste}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-task-detail-title"
        className={`flex w-full flex-col border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 ${
          isFullscreen
            ? "h-full max-h-none max-w-none rounded-none"
            : "max-h-[92vh] max-w-5xl rounded-2xl"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{milestone.title}</p>
            <h2 id="milestone-task-detail-title" className="text-sm font-semibold text-neutral-900 dark:text-white">
              子任务详情
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen((value) => !value)}
              className="rounded-lg px-2 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? "退出全屏" : "全屏"}
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="关闭详情"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-hidden px-5 py-4 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-h-0 flex-col gap-5 overflow-hidden">
            <label className="block shrink-0">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                标题
              </span>
              <input
                value={task.title}
                onChange={(event) => updateTitle(event.target.value)}
                onBlur={(event) => updateTitle(event.target.value)}
                maxLength={160}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </label>

            <section className="task-description-panel flex min-h-[420px] flex-1 flex-col overflow-hidden">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div>
                  <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    详情内容
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    支持 Markdown，适合保存需求实现提示词、SQL 和排查记录。
                  </span>
                </div>
                <div className="flex shrink-0 rounded-lg bg-neutral-100 p-0.5 text-xs dark:bg-neutral-800">
                  <button
                    onClick={() => setDescriptionMode("edit")}
                    className={`rounded-md px-2 py-1 ${
                      descriptionMode === "edit"
                        ? "bg-white text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-white"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDescriptionMode("preview")}
                    className={`rounded-md px-2 py-1 ${
                      descriptionMode === "preview"
                        ? "bg-white text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-white"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    预览
                  </button>
                </div>
              </div>
              {descriptionMode === "edit" ? (
                <MarkdownEditor
                  value={description}
                  onChange={(value) =>
                    updateDetails(milestone.id, task.id, { description: value })
                  }
                  placeholder={`# 需求实现提示词

- 背景
- 实现要求

\`\`\`sql
select * from tag_data;
\`\`\``}
                />
              ) : (
                <MarkdownPreview value={description} className="min-h-[420px] flex-1" />
              )}
            </section>
          </div>

          <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  <Paperclip size={14} weight="bold" />
                  附件
                </h3>
                <button
                  onClick={handleUpload}
                  disabled={!canUseAttachments}
                  className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-pomodoro-50 hover:text-pomodoro-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-pomodoro-500/15"
                >
                  <UploadSimple size={13} weight="bold" />
                  上传
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar,.7z"
                  onChange={(event) => handleBrowserFiles(event.target.files)}
                />
              </div>

              {!canUseAttachments && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                  <WarningCircle size={15} className="mt-0.5 shrink-0" />
                  <span>请先设置数据存储目录，之后才能上传文档或粘贴图片。</span>
                </div>
              )}

              {error && (
                <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="rounded-xl border border-dashed border-neutral-200 px-3 py-3 text-center text-xs text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                在弹窗内直接粘贴图片，可一次关联多张。
              </div>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <ImageIcon size={14} weight="bold" />
                图片
              </h3>
              {imageAttachments.length === 0 ? (
                <p className="rounded-xl bg-neutral-50 px-3 py-4 text-center text-xs text-neutral-400 dark:bg-neutral-800/60 dark:text-neutral-500">
                  暂无图片
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {imageAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                      title={attachment.name}
                    >
                      {previewUrls[attachment.id] ? (
                        <button
                          type="button"
                          onClick={() => setSelectedImageId(attachment.id)}
                          className="h-full w-full cursor-zoom-in"
                          aria-label={`查看原图${attachment.name}`}
                        >
                          <img
                            src={previewUrls[attachment.id]}
                            alt={attachment.name}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="flex h-full items-center justify-center text-neutral-300">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveAttachment(attachment);
                        }}
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-neutral-400 opacity-0 shadow-sm transition-opacity hover:text-red-500 group-hover:opacity-100 dark:bg-neutral-900/90"
                        aria-label={`删除${attachment.name}`}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <FileText size={14} weight="bold" />
                文档
              </h3>
              {documentAttachments.length === 0 ? (
                <p className="rounded-xl bg-neutral-50 px-3 py-4 text-center text-xs text-neutral-400 dark:bg-neutral-800/60 dark:text-neutral-500">
                  暂无文档
                </p>
              ) : (
                <ul className="space-y-2">
                  {documentAttachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                    >
                      <FileText size={17} className="shrink-0 text-neutral-400" />
                      <button
                        onClick={() => openAttachment(dataPath, attachment)}
                        className="min-w-0 flex-1 text-left"
                        title={attachment.name}
                      >
                        <span className="block truncate text-xs font-medium text-neutral-700 dark:text-neutral-200">
                          {attachment.name}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {formatSize(attachment.size)}
                        </span>
                      </button>
                      <button
                        onClick={() => handleRemoveAttachment(attachment)}
                        className="rounded-full p-1 text-neutral-300 hover:bg-white hover:text-red-500 dark:hover:bg-neutral-700"
                        aria-label={`删除${attachment.name}`}
                      >
                        <Trash size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 shrink-0 border-t border-neutral-100 bg-white px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              完成时间
            </span>
            <input
              value={task.completedAt ?? ""}
              onChange={(event) =>
                updateDetails(milestone.id, task.id, { completedAt: event.target.value })
              }
              placeholder="yyyy-MM-dd HH:mm:ss"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-900 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </label>
        </div>
      </section>

      {selectedImage && selectedImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImageId(null)}
        >
          <div
            className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-neutral-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{selectedImage.name}</p>
                <p className="text-xs text-neutral-400">{formatSize(selectedImage.size)}</p>
              </div>
              <button
                onClick={() => setSelectedImageId(null)}
                className="rounded-full p-1.5 text-neutral-300 hover:bg-white/10 hover:text-white"
                aria-label="关闭原图预览"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <img
                src={selectedImageUrl}
                alt={selectedImage.name}
                className="mx-auto max-h-[calc(100vh-8rem)] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
