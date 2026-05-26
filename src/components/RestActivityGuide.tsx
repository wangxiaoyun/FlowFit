import { KegelGuide } from "./KegelGuide";
import type { RestActivityType } from "../types";

interface RestActivityGuideProps {
  activityType: RestActivityType;
  reps: number;
  holdSeconds: number;
  onDone: () => void;
  onSkip: () => void;
}

const STRETCH_STEPS = ["肩颈放松 20 秒", "肩胛后收 10 次", "脚踝绕环各 10 圈"];
const BREATHING_STEPS = ["吸气 4 秒", "停留 2 秒", "呼气 6 秒，重复 4 轮"];

export function RestActivityGuide({
  activityType,
  reps,
  holdSeconds,
  onDone,
  onSkip,
}: RestActivityGuideProps) {
  if (activityType === "pelvicFloor") {
    return (
      <KegelGuide
        reps={reps}
        holdSeconds={holdSeconds}
        onDone={onDone}
        onSkip={onSkip}
      />
    );
  }

  const isBreathing = activityType === "breathing";
  const title = isBreathing ? "呼吸放松" : "轻运动";
  const subtitle = isBreathing ? "放慢节奏，给大脑换气" : "专注结束，活动一下吧";
  const steps = isBreathing ? BREATHING_STEPS : STRETCH_STEPS;

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl">{isBreathing ? "🌿" : "🧘"}</span>
        <h3 className="text-sm font-semibold tracking-wide text-neutral-800 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {subtitle}
        </p>
      </div>

      <div className="w-full space-y-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-2 dark:bg-blue-950/30"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
              {step}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {isBreathing
            ? "保持自然舒适即可，如有不适可直接跳过。"
            : "动作幅度保持轻柔，重点是离开久坐姿势。"}
        </p>
      </div>

      <div className="flex w-full gap-3">
        <button
          onClick={onSkip}
          className="flex-1 rounded-xl border border-neutral-200 py-2 text-xs text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          跳过
        </button>
        <button
          onClick={onDone}
          className="flex-1 rounded-xl bg-blue-500 py-2 text-xs font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          完成并休息
        </button>
      </div>
    </div>
  );
}
