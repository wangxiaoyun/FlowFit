import { describe, expect, it } from "vitest";
import {
  buildAttachmentRelativePath,
  createAttachmentRecord,
  ensureAttachmentDataPath,
  isSupportedDocumentFile,
} from "./taskAttachments";

describe("task attachment utilities", () => {
  it("keeps the original extension while storing files under the task attachment folder", () => {
    expect(buildAttachmentRelativePath("task-1", "attachment-1", "Bug截图.PNG")).toBe(
      "attachments/milestone-tasks/task-1/attachment-1.png",
    );
    expect(buildAttachmentRelativePath("task-1", "attachment-2", "需求说明")).toBe(
      "attachments/milestone-tasks/task-1/attachment-2",
    );
  });

  it("creates attachment metadata without exposing absolute paths", () => {
    const record = createAttachmentRecord({
      id: "attachment-1",
      taskId: "task-1",
      name: "方案.pdf",
      mimeType: "application/pdf",
      size: 2048,
      source: "upload",
    });

    expect(record).toMatchObject({
      id: "attachment-1",
      kind: "document",
      name: "方案.pdf",
      mimeType: "application/pdf",
      size: 2048,
      relativePath: "attachments/milestone-tasks/task-1/attachment-1.pdf",
      source: "upload",
    });
    expect(record.createdAt).toEqual(expect.any(Number));
  });

  it("returns a clear error when attachments are used before a data directory is configured", () => {
    expect(() => ensureAttachmentDataPath("")).toThrow("请先设置数据存储目录");
  });

  it("accepts common document attachment formats and rejects executables", () => {
    expect(isSupportedDocumentFile("接口说明.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
    expect(isSupportedDocumentFile("周报.md", "text/markdown")).toBe(true);
    expect(isSupportedDocumentFile("archive.7z", "")).toBe(true);
    expect(isSupportedDocumentFile("installer.exe", "application/x-msdownload")).toBe(false);
  });
});
