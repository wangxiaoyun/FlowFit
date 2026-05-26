import { useState, useEffect, useRef } from "react";

export interface KegelState {
  currentRep: number;             // 当前组数（1-based）
  phase: "contract" | "relax";   // 收缩阶段 or 放松阶段
  secondsLeft: number;            // 当前阶段剩余秒数
  isComplete: boolean;
}

/**
 * 驱动盆底肌训练倒计时。每组 = 收缩 holdSeconds 秒 + 放松 1 秒。
 * 完成全部 reps 组后调用 onComplete。
 */
export function useKegel(
  reps: number,
  holdSeconds: number,
  onComplete: () => void
): KegelState {
  // 全局 tick：每秒 +1，驱动所有状态
  const [tick, setTick] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const restSeconds = 3; // 每组放松休息秒数
  const ticksPerRep = holdSeconds + restSeconds;
  const totalTicks = reps * ticksPerRep;

  // 主计时 interval
  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isComplete]);

  // 检测完成
  useEffect(() => {
    if (!isComplete && tick >= totalTicks) {
      const id = window.setTimeout(() => setIsComplete(true), 0);
      return () => window.clearTimeout(id);
    }
  }, [tick, totalTicks, isComplete]);

  // 完成回调
  useEffect(() => {
    if (isComplete) onCompleteRef.current();
  }, [isComplete]);

  // 从 tick 派生当前阶段信息
  const clampedTick = Math.min(tick, totalTicks - 1);
  const repIndex = Math.floor(clampedTick / ticksPerRep);
  const currentRep = repIndex + 1;
  const tickInRep = clampedTick % ticksPerRep;
  const phase: "contract" | "relax" = tickInRep < holdSeconds ? "contract" : "relax";
  const secondsLeft = phase === "contract" ? holdSeconds - tickInRep : restSeconds - (tickInRep - holdSeconds);

  return { currentRep, phase, secondsLeft, isComplete };
}
