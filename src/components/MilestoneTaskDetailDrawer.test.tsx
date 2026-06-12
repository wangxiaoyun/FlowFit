import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MilestoneTaskDetailDrawer } from "./MilestoneTaskDetailDrawer";
import type { Milestone, MilestoneTask } from "../types";

const task: MilestoneTask = {
  id: "task-1",
  title: "subtask detail",
  done: false,
  createdAt: 1000,
  description: "# Prompt archive\n\n- paste multiple images\n\n```sql\nselect * from tag_data\n```",
  attachments: [
    {
      id: "image-1",
      kind: "image",
      name: "screenshot.png",
      mimeType: "image/png",
      size: 512,
      relativePath: "attachments/milestone-tasks/task-1/image-1.png",
      source: "paste",
      createdAt: 1001,
    },
    {
      id: "doc-1",
      kind: "document",
      name: "spec.pdf",
      mimeType: "application/pdf",
      size: 1024,
      relativePath: "attachments/milestone-tasks/task-1/doc-1.pdf",
      source: "upload",
      createdAt: 1002,
    },
  ],
};

const milestone: Milestone = {
  id: "milestone-1",
  title: "IOP online bugs",
  collapsed: false,
  createdAt: 900,
  tasks: [task],
};

function renderDrawer(dataPath = "D:/flowfit-data") {
  return renderToStaticMarkup(
    <MilestoneTaskDetailDrawer
      milestone={milestone}
      task={task}
      dataPath={dataPath}
      onClose={() => {}}
    />,
  );
}

describe("MilestoneTaskDetailDrawer", () => {
  it("renders as a centered modal dialog with editable detail fields and existing attachments", () => {
    const markup = renderDrawer();

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("subtask detail");
    expect(markup).toContain('data-markdown-editor="codemirror"');
    expect(markup).toContain("screenshot.png");
    expect(markup).toContain("spec.pdf");
  });

  it("offers Markdown editing and preview affordances for long prompt notes", () => {
    const markup = renderDrawer();

    expect(markup).toContain("Markdown");
    expect(markup).toContain('data-markdown-editor="codemirror"');
    expect(markup).toContain('aria-label="Markdown editor"');
  });

  it("uses a larger default modal and exposes a fullscreen action", () => {
    const markup = renderDrawer();

    expect(markup).toContain("max-w-5xl");
    expect(markup).toContain("max-h-[92vh]");
    expect(markup).toContain('aria-label="Toggle fullscreen"');
  });

  it("keeps the Markdown editor tall and pins completion time to the bottom", () => {
    const markup = renderDrawer();

    expect(markup).toContain("task-description-panel");
    expect(markup).toContain("min-h-[420px]");
    expect(markup).toContain("flex-1");
    expect(markup).toContain("sticky bottom-0");
  });

  it("disables upload when attachments cannot be persisted", () => {
    const markup = renderDrawer("");

    expect(markup).toContain("disabled");
  });
});
