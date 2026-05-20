import { useKegel } from "../hooks/useKegel";

const HEALTH_TIPS = [
  "提肛运动可增强盆底肌群，预防久坐导致的腰背酸痛",
  "每次收缩保持 3-5 秒后充分放松，训练效果最佳",
  "坚持每日练习可改善盆腔血液循环，有助于提升专注力",
  "提肛运动随时随地可做，无需器械，是上班族的隐形健身神器",
  "盆底肌强健有助于改善坐姿，减少脊柱长期压力",
];

interface KegelGuideProps {
  reps: number;
  holdSeconds: number;
  onDone: () => void;
  onSkip: () => void;
}

/**
 * 提肛引导卡。替换计时器中列区域，引导用户完成 N 组提肛动作。
 * 完成全部组数后自动调用 onDone；跳过按钮也调用 onDone（效果一致）。
 */
export function KegelGuide({ reps, holdSeconds, onDone, onSkip }: KegelGuideProps) {
  const { currentRep, phase, secondsLeft } = useKegel(reps, holdSeconds, onDone);

  const tip = HEALTH_TIPS[(currentRep - 1) % HEALTH_TIPS.length];
  const showDots = reps <= 15;

  // 进度条宽度：收缩阶段从满到空，放松阶段固定空
  const barPercent = phase === "contract" ? (secondsLeft / holdSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* 标题 */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl">💪</span>
        <h3 className="text-sm font-semibold tracking-wide text-neutral-800 dark:text-white">
          提肛练习
        </h3>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          专注结束，活动一下吧
        </p>
      </div>

      {/* 当前动作 + 进度条 */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between text-xs font-medium">
          <span
            className={
              phase === "contract"
                ? "text-blue-600 dark:text-blue-400"
                : "text-green-600 dark:text-green-400"
            }
          >
            {phase === "contract" ? "收缩" : "放松"}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">
            {phase === "contract" ? `${secondsLeft}s` : "1s"}
          </span>
        </div>

        {/* 进度条 */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              phase === "contract"
                ? "bg-blue-500 dark:bg-blue-400"
                : "bg-green-400 dark:bg-green-500"
            }`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      {/* 组数进度 */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          第 {currentRep} 组 / {reps} 组
        </span>

        {showDots ? (
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: reps }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i < currentRep - 1
                    ? "bg-blue-500 dark:bg-blue-400"
                    : i === currentRep - 1
                      ? "bg-blue-300 dark:bg-blue-600"
                      : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(currentRep / reps) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* 健康小知识 */}
      <div className="w-full rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">💡 健康小知识</p>
        <p className="text-xs leading-relaxed text-blue-600 dark:text-blue-300">{tip}</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex w-full gap-3">
        {/* 保留可点击状态，isComplete 时仍可手动操作作为保底 */}
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
