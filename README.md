# Pomodoro Timer

一个功能完整的番茄钟桌面应用，使用 React + TypeScript + Vite 构建。

## 功能

- **番茄钟计时器** — 25 分钟工作 / 5 分钟休息，支持开始、暂停、重置
- **圆形进度动画** — SVG 驱动的进度环，实时显示剩余时间
- **任务管理** — 添加/删除任务，跟踪每个任务的番茄钟完成数，标记完成
- **数据统计** — 今日番茄钟总数、连续番茄钟数、完成任务数
- **暗色/亮色主题** — 支持自动跟随系统、手动切换
- **声音通知** — Web Audio API 生成提示音，无需外部音频文件
- **设置面板** — 可调节工作和休息时长、音量、自动开始
- **数据持久化** — 所有数据通过 localStorage 保存，刷新不丢失

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 18 + TypeScript (strict) |
| 构建 | Vite |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS v4 |
| 图标 | Phosphor Icons |
| 音频 | Web Audio API |
| 持久化 | localStorage |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── types/index.ts          # 类型定义
├── constants/index.ts      # 常量、默认配置
├── utils/
│   ├── storage.ts          # localStorage 持久化工具
│   └── audio.ts            # Web Audio API 声音生成
├── store/
│   ├── timerStore.ts       # 计时器状态管理
│   └── taskStore.ts        # 任务和统计状态管理
├── hooks/
│   ├── useTimer.ts         # 计时器核心调度
│   └── useTheme.ts         # 主题切换
├── components/
│   ├── CircularProgress.tsx  # SVG 圆形进度条
│   ├── TimerDisplay.tsx      # 计时器主视图
│   ├── TimerControls.tsx     # 开始/暂停/重置按钮
│   ├── Header.tsx            # 顶部导航 + 设置弹窗
│   ├── StatsPanel.tsx        # 今日统计面板
│   └── TaskList.tsx          # 任务管理列表
├── App.tsx                 # 主页面布局
├── main.tsx                # 入口
└── index.css               # Tailwind + 全局样式
```

## 验收标准

- [x] 计时器精度误差小于 0.5 秒/分钟（基于 `setInterval` 秒级 tick）
- [x] 页面关闭后重新打开，任务和统计数据正确恢复
- [x] 完成一个番茄钟后自动切换到休息倒计时
- [x] TypeScript 严格模式
- [x] 组件化设计，职责清晰
- [x] 响应式布局，适配 PC 和移动端
