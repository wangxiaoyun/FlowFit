import { getRestActivityOption, REST_ACTIVITY_OPTIONS } from "../utils/restActivities";
import type { RestActivityType } from "../types";

interface RestPreferenceDialogProps {
  onSelect: (type: RestActivityType) => void;
}

export function RestPreferenceDialog({ onSelect }: RestPreferenceDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            选择休息方式
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            用于在专注结束后推荐合适的短休息活动，可随时在设置中修改。
          </p>
        </div>

        <div className="space-y-2">
          {REST_ACTIVITY_OPTIONS.map((option) => {
            const resolved = getRestActivityOption(option.type);
            return (
              <button
                key={resolved.type}
                onClick={() => onSelect(resolved.type)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
              >
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {resolved.title}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {resolved.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
