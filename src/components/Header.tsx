import { useCallback, useState } from "react";
import {
  Sun,
  Moon,
  Gear,
  X,
  Clock,
  Timer,
  Bell,
  BellSlash,
  BellRinging,
  Link,
  Question,
  FolderOpen,
  HardDrive,
  NotePencil,
  Key,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../hooks/useTheme";
import { useTimerStore } from "../store/timerStore";
import type { Settings } from "../types";
import { isTauri, selectDirectory } from "../utils/fileStorage";
import { testDeepSeekKey } from "../utils/deepseek";
import { WeeklyReportModal } from "./WeeklyReportModal";

/**
 * 顶部导航栏：应用标题、主题切换、使用说明、设置入口、周报入口。
 */
export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const hasApiKey = !!useTimerStore((s) => s.settings.deepseekApiKey);

  return (
    <>
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Timer size={22} weight="duotone" className="text-blue-500" />
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
            FlowFit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label={`切换到${theme === "dark" ? "浅色" : "深色"}主题`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {/* 周报按钮：配置了 API Key 才显示 */}
          {hasApiKey && (
            <button
              onClick={() => setShowReport(true)}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              aria-label="生成工作周报"
              title="AI 工作周报"
            >
              <NotePencil size={18} />
            </button>
          )}
          <button
            onClick={() => setShowHelp(true)}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="使用说明"
          >
            <Question size={18} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="打开设置"
          >
            <Gear size={18} />
          </button>
        </div>
      </header>

      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showReport && <WeeklyReportModal onClose={() => setShowReport(false)} />}
    </>
  );
}

/** 使用说明弹窗 */
function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-900 dark:text-white">
            如何使用
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* 番茄工作法简介 */}
          <div className="rounded-xl bg-pomodoro-50 p-4 dark:bg-pomodoro-500/10">
            <div className="mb-2 text-xs font-semibold text-pomodoro-600 dark:text-pomodoro-400">
              🍅 什么是番茄工作法？
            </div>
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              由 Francesco Cirillo 在 1980 年代创立的时间管理方法。将工作拆成
              <strong> 25 分钟专注块</strong>，每块之间短暂休息，帮助大脑保持专注、减少疲劳。
            </p>
          </div>

          {/* 使用步骤 */}
          <div>
            <div className="mb-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              📋 使用步骤
            </div>
            <ol className="space-y-2.5">
              {[
                "在任务列表添加今天要完成的事项",
                "点击「开始」，专注工作 25 分钟",
                "铃声响起后，休息 5 分钟",
                "重复以上步骤，每 4 个番茄钟享受一次长休息",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      i === 3 ? "bg-break-500" : "bg-pomodoro-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* 小技巧 */}
          <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-700/50">
            <div className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              ⚙️ 小技巧
            </div>
            <ul className="space-y-1.5">
              {[
                "在设置里可以调整专注 / 休息时长，开启自动连续模式",
                "开启桌面通知，计时结束时系统会弹出提醒",
                "点击任务列表顶部的日期可以查看近 7 天的历史任务",
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 设置弹窗 */
function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useTimerStore();
  const [pickingDir, setPickingDir] = useState(false);
  const [keyInput, setKeyInput] = useState(settings.deepseekApiKey);
  const [verifying, setVerifying] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(
    settings.deepseekApiKey ? true : null
  );

  const handleChange = useCallback(
    (partial: Partial<Settings>) => {
      updateSettings(partial);
    },
    [updateSettings],
  );

  const handleVerifyKey = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setVerifying(true);
    setKeyValid(null);
    const ok = await testDeepSeekKey(trimmed);
    setKeyValid(ok);
    if (ok) handleChange({ deepseekApiKey: trimmed });
    setVerifying(false);
  };

  const handleKeyBlur = () => {
    // 输入框失焦时如果内容变化则重置验证状态
    if (keyInput.trim() !== settings.deepseekApiKey) {
      setKeyValid(null);
    }
  };

  const handleSelectDataPath = async () => {
    setPickingDir(true);
    const dir = await selectDirectory();
    setPickingDir(false);
    if (dir) handleChange({ dataPath: dir });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-full max-w-sm flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800" style={{ maxHeight: "88vh" }}>
        {/* 标题栏固定不随内容滚动 */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-0 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-900 dark:text-white">
            设置
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区可滚动 */}
        <div className="scrollbar-thin overflow-y-auto px-6 pb-6 pt-5">
        <div className="space-y-5">
          {/* 专注时长 */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <Clock size={14} />
              专注时长（分钟）
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.focusDuration}
              onChange={(e) =>
                handleChange({ focusDuration: Math.max(1, Number(e.target.value)) })
              }
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>

          {/* 休息时长 */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <Clock size={14} />
              休息时长（分钟）
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.breakDuration}
              onChange={(e) =>
                handleChange({ breakDuration: Math.max(1, Number(e.target.value)) })
              }
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>

          {/* 声音通知 */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-600 dark:bg-neutral-700/50">
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
              {settings.soundEnabled ? (
                <Bell size={16} className="text-pomodoro-400" />
              ) : (
                <BellSlash size={16} className="text-neutral-400" />
              )}
              声音通知
            </div>
            <button
              onClick={() => handleChange({ soundEnabled: !settings.soundEnabled })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                settings.soundEnabled
                  ? "bg-pomodoro-500"
                  : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  settings.soundEnabled ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          {/* 音量滑块 */}
          {settings.soundEnabled && (
            <div>
              <label className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                音量：{Math.round(settings.volume * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.volume * 100)}
                onChange={(e) =>
                  handleChange({ volume: Number(e.target.value) / 100 })
                }
                className="w-full accent-pomodoro-500"
              />
            </div>
          )}

          {/* 桌面通知 */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-600 dark:bg-neutral-700/50">
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
              <BellRinging size={16} className="text-amber-400" />
              桌面通知
            </div>
            <button
              onClick={() => handleChange({ desktopNotify: !settings.desktopNotify })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                settings.desktopNotify
                  ? "bg-pomodoro-500"
                  : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  settings.desktopNotify ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          {/* 飞书 Webhook */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <Link size={14} />
              飞书机器人 Webhook 地址
            </label>
            <input
              type="url"
              value={settings.feishuWebhook}
              onChange={(e) => handleChange({ feishuWebhook: e.target.value })}
              placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
            />
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              在飞书创建群机器人，将 Webhook 地址粘贴到此处，完成番茄钟后自动发送通知。
            </p>
          </div>

          {/* 数据文件目录（仅桌面端可用） */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <HardDrive size={14} />
              本地数据备份目录
            </label>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                {settings.dataPath || "未设置（仅存储在浏览器本地）"}
              </div>
              {isTauri && (
                <button
                  onClick={handleSelectDataPath}
                  disabled={pickingDir}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                >
                  <FolderOpen size={13} />
                  选择
                </button>
              )}
              {settings.dataPath && (
                <button
                  onClick={() => handleChange({ dataPath: "" })}
                  className="flex shrink-0 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2 text-neutral-400 hover:text-red-500 dark:border-neutral-600 dark:bg-neutral-700"
                  aria-label="清除数据路径"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              {isTauri
                ? "设置后，任务、统计、目标数据将实时同步写入该目录的 JSON 文件，防止数据丢失。"
                : "需在桌面应用（exe）中使用此功能。"}
            </p>
          </div>

          {/* 长休息时长 */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <Clock size={14} />
              长休息时长（分钟）
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={settings.longBreakDuration}
              onChange={(e) =>
                handleChange({ longBreakDuration: Math.max(5, Number(e.target.value)) })
              }
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>

          {/* 长休息间隔 */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <Clock size={14} />
              每几个番茄长休息一次
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={settings.longBreakInterval}
              onChange={(e) =>
                handleChange({ longBreakInterval: Math.max(2, Number(e.target.value)) })
              }
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-pomodoro-400 focus:outline-none focus:ring-2 focus:ring-pomodoro-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>

          {/* 自动连续 */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={settings.autoStartBreak}
                onChange={(e) => handleChange({ autoStartBreak: e.target.checked })}
                className="h-4 w-4 accent-pomodoro-500"
              />
              自动开始休息
            </label>
            <label className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={settings.autoStartFocus}
                onChange={(e) => handleChange({ autoStartFocus: e.target.checked })}
                className="h-4 w-4 accent-pomodoro-500"
              />
              自动开始专注
            </label>
          </div>

          {/* 提肛提醒 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-600 dark:bg-neutral-700/50">
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                💪 专注结束时提肛提醒
              </span>
              <button
                onClick={() => handleChange({ kegelEnabled: !settings.kegelEnabled })}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  settings.kegelEnabled
                    ? "bg-blue-500"
                    : "bg-neutral-300 dark:bg-neutral-600"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    settings.kegelEnabled ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </div>

            {settings.kegelEnabled && (
              <>
                <div>
                  <label className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    提肛次数（组）
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.kegelReps}
                    onChange={(e) =>
                      handleChange({ kegelReps: Math.min(30, Math.max(1, Number(e.target.value))) })
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    建议 10-20 组，新手从 10 组开始
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    每组保持秒数
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.kegelHoldSeconds}
                    onChange={(e) =>
                      handleChange({
                        kegelHoldSeconds: Math.min(10, Math.max(1, Number(e.target.value))),
                      })
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    建议 3-5 秒，最大 10 秒
                  </p>
                </div>
              </>
            )}
          </div>

          {/* DeepSeek API Key */}
          <div className="space-y-2">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <Key size={14} />
              DeepSeek API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setKeyValid(null); }}
                onBlur={handleKeyBlur}
                placeholder="sk-..."
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
              />
              <button
                onClick={handleVerifyKey}
                disabled={verifying || !keyInput.trim()}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
              >
                {verifying ? (
                  <span className="animate-pulse">验证中…</span>
                ) : (
                  "验证"
                )}
              </button>
            </div>
            {/* 验证状态提示 */}
            {keyValid === true && (
              <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle size={13} weight="fill" />
                API Key 有效，已保存
              </p>
            )}
            {keyValid === false && (
              <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                <WarningCircle size={13} weight="fill" />
                验证失败，请检查 Key 是否正确
              </p>
            )}
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              配置后可使用 AI 新闻精编（含摘要）和工作周报生成功能。
            </p>
          </div>
        </div>
        </div> {/* overflow-y-auto 滚动区结束 */}
      </div>
    </div>
  );
}
