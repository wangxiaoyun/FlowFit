import type { RestActivityType, Settings } from "../types";

export interface RestActivityOption {
  type: RestActivityType;
  title: string;
  description: string;
}

export const REST_ACTIVITY_OPTIONS: RestActivityOption[] = [
  {
    type: "stretch",
    title: "轻运动",
    description: "肩颈、肩胛、髋部和脚踝循环，适合作为默认短休息。",
  },
  {
    type: "breathing",
    title: "呼吸放松",
    description: "低打扰的呼吸节奏，适合办公室和会议间隙。",
  },
  {
    type: "pelvicFloor",
    title: "盆底肌训练",
    description: "可按组数和保持秒数进行训练，适合作为可选活动。",
  },
  {
    type: "none",
    title: "暂不选择",
    description: "专注结束后直接进入普通休息，不弹出活动引导。",
  },
];

export function getRestActivityOption(type: RestActivityType): RestActivityOption {
  return REST_ACTIVITY_OPTIONS.find((option) => option.type === type) ?? REST_ACTIVITY_OPTIONS[0];
}

export function normalizeRestSettings(
  stored: Partial<Settings>,
): Pick<Settings, "restPreferenceSet" | "restActivityType"> {
  if (
    typeof stored.restPreferenceSet === "boolean" &&
    isRestActivityType(stored.restActivityType)
  ) {
    return {
      restPreferenceSet: stored.restPreferenceSet,
      restActivityType: stored.restActivityType,
    };
  }

  if (Object.prototype.hasOwnProperty.call(stored, "kegelEnabled")) {
    return {
      restPreferenceSet: true,
      restActivityType: stored.kegelEnabled ? "pelvicFloor" : "none",
    };
  }

  return {
    restPreferenceSet: false,
    restActivityType: "stretch",
  };
}

function isRestActivityType(value: unknown): value is RestActivityType {
  return (
    value === "stretch" ||
    value === "breathing" ||
    value === "pelvicFloor" ||
    value === "none"
  );
}
