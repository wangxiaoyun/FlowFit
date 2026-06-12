import { beforeEach, describe, expect, it } from "vitest";
import { useMilestoneStore } from "./milestoneStore";

const milestoneId = "milestone-1";
const taskId = "task-1";

beforeEach(() => {
  useMilestoneStore.setState({
    milestones: [
      {
        id: milestoneId,
        title: "IOP上线bug",
        collapsed: false,
        createdAt: 1000,
        tasks: [
          {
            id: taskId,
            title: "跑批工单生成第三步sql",
            done: false,
            createdAt: 1001,
          },
        ],
      },
    ],
  });
});

describe("milestone task details", () => {
  it("updates title, description, and completion time for a subtask", () => {
    const store = useMilestoneStore.getState() as any;

    store.updateMilestoneTaskDetails(milestoneId, taskId, {
      title: "跑批工单字段修复",
      description: "补充 tag_data 接入能力标签说明",
      completedAt: "2026-06-12 10:30:00",
    });

    const task = useMilestoneStore
      .getState()
      .milestones[0].tasks.find((item) => item.id === taskId);

    expect(task).toMatchObject({
      title: "跑批工单字段修复",
      description: "补充 tag_data 接入能力标签说明",
      completedAt: "2026-06-12 10:30:00",
    });
  });

  it("adds and removes attachment metadata without requiring legacy tasks to define attachments", () => {
    const store = useMilestoneStore.getState() as any;
    const attachment = {
      id: "attachment-1",
      kind: "image",
      name: "screenshot.png",
      mimeType: "image/png",
      size: 42,
      relativePath: "attachments/milestone-tasks/task-1/attachment-1.png",
      source: "paste",
      createdAt: 1234,
    };

    expect(useMilestoneStore.getState().milestones[0].tasks[0]).not.toHaveProperty(
      "attachments",
    );

    store.addMilestoneTaskAttachment(milestoneId, taskId, attachment);

    expect(useMilestoneStore.getState().milestones[0].tasks[0].attachments).toEqual([
      attachment,
    ]);

    store.removeMilestoneTaskAttachment(milestoneId, taskId, "attachment-1");

    expect(useMilestoneStore.getState().milestones[0].tasks[0].attachments).toEqual(
      [],
    );
  });
});
