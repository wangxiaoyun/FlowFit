<div align="center">
  <img src="public/favicon.svg" alt="FlowFit 标志" width="80" />
  <h1>FlowFit</h1>
  <p><strong>健康打工人生产力工具 — 番茄钟桌面应用</strong></p>
  <p>
    <a href="#功能特性">功能特性</a> •
    <a href="#截图">截图</a> •
    <a href="#技术栈">技术栈</a> •
    <a href="#快速开始">快速开始</a> •
    <a href="#项目结构">项目结构</a> •
    <a href="./README.md">English</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/版本-1.4.1-blue" alt="版本" />
    <img src="https://img.shields.io/badge/许可证-MIT-green" alt="许可证" />
    <img src="https://img.shields.io/badge/平台-Windows%20%7C%20macOS-lightgrey" alt="平台" />
  </p>
</div>

---

## 概述

**FlowFit** 是一款基于 Tauri v2 + React + TypeScript 的桌面番茄钟应用。不止是计时器——它集成了**任务管理、提肛（Kegel）运动引导、里程碑规划、AI 日报/周报生成和休息活动偏好**等功能，专为关注生产力与身体健康的知识工作者设计。

> 🚧 **开发状态**：持续活跃开发中，macOS DMG 版本通过 GitHub Actions 自动构建。

## 功能特性

### 🍅 核心番茄钟
- **专注 / 短休息 / 长休息** 三阶段，时长可自由调节
- **SVG 圆形进度动画**，实时视觉反馈
- 计时环内显示**当前激活任务名称**
- **自动开始**模式，无缝衔接专注流
- **Web Audio API 提示音**，无需外部音频文件
- **系统原生通知**

### ✅ 任务管理
- 添加/删除任务，跟踪每个任务的番茄钟完成数
- **激活任务**——激活期间完成的番茄钟自动计入该任务
- 完成任务标记，自动汇总每日统计

### 🏋️ 提肛运动（Kegel Exercise）
- 每个专注阶段结束后引导 **Kegel 运动**——收缩/放松节奏
- **屏幕右下角弹窗**，无边框、置顶、不占任务栏
- 可配置组数和保持时长
- 运动期间轮播**健康知识小贴士**
- 与休息计时器无缝衔接——运动结束后进入休息

### 🎯 里程碑规划
- 创建**项目里程碑**，分解为子任务列表
- **拖拽排序**——里程碑和子任务均可拖拽调整顺序
- 折叠/展开里程碑分组
- 子任务自动记录完成时间
- 一键将子任务加入当前番茄钟队列

### 📊 日报与周报
- **AI 智能报告生成**（集成 DeepSeek API）
- 日报：基于今日数据自动生成工作总结
- 周报：全面的周度回顾与趋势分析
- Markdown 格式，便于导出
- 未配置 API Key 时自动降级为规则摘要

### 🧘 休息活动偏好
- 选择偏好的休息活动：**伸展运动 / 呼吸练习 / 盆底肌运动**
- 每次专注结束后弹出引导
- 首次使用偏好选择对话框
- 帮助建立健康的工作-休息节律

### 🎨 主题与界面
- **浅色 / 深色 / 跟随系统** 三种主题模式
- 响应式布局（窄屏自动切换为紧凑单列）
- Phosphor 图标统一风格
- Tailwind CSS v4 样式
- **系统托盘**——显示/隐藏和退出
- 关闭窗口时**最小化到托盘**（Windows）

### 💾 数据持久化
- `localStorage` 浏览器回退方案
- **Tauri FS 本地文件存储**（桌面端，重装不丢数据）
- 配置后所有数据在应用重启和重装后仍然保留

## 截图

| 主计时界面 | 设置面板 | Kegel 弹窗 |
|:---:|:---:|:---:|
| ![主页面](main-page.png) | ![设置](settings-olddata.png) | ![Kegel 弹窗](drag-hover.png) |

> *截图会随 UI 更新而替换。*

## 技术栈

| 层 | 技术 |
|-------|-----------|
| **桌面壳** | Tauri v2 (Rust) |
| **前端** | React 19 + TypeScript 6（严格模式） |
| **构建** | Vite 8 |
| **状态管理** | Zustand |
| **样式** | Tailwind CSS v4 |
| **图标** | Phosphor Icons |
| **音频** | Web Audio API |
| **报告** | DeepSeek API |
| **桌面能力** | Tauri FS、Dialog、Opener 插件 |

## 快速开始

### 前置要求

- **Node.js** >= 18
- **Rust** >= 1.77（Tauri 桌面构建需要）
- **Windows**：MSVC 构建工具（Visual Studio Build Tools 或 `visualstudio` Cargo feature）
- **macOS**：Xcode Command Line Tools（`xcode-select --install`）

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/flowfit.git
cd flowfit

# 安装前端依赖
npm install

# 开发模式运行（热重载）
npm run tauri:dev

# 构建桌面安装包
npm run tauri:build
```

### 仅浏览器开发

```bash
npm run dev
# 浏览器打开 http://localhost:5173
# 注意：文件持久化和 Kegel 弹窗需要 Tauri 桌面运行环境
```

## 项目结构

```
flowfit/
├── src/                          # 前端源码
│   ├── main.tsx                  # 入口（主应用 + 子窗口路由）
│   ├── App.tsx                   # 主布局
│   ├── index.css                 # Tailwind + 全局样式
│   ├── types/index.ts            # TypeScript 类型定义
│   ├── constants/index.ts        # 默认值、颜色配置
│   ├── components/
│   │   ├── TimerDisplay.tsx       # 计时器主界面（圆形进度）
│   │   ├── TimerControls.tsx      # 开始/暂停/重置按钮
│   │   ├── CircularProgress.tsx   # SVG 进度环组件
│   │   ├── Header.tsx             # 顶栏 + 设置 + 主题切换
│   │   ├── StatsPanel.tsx         # 今日统计面板
│   │   ├── WeekChart.tsx          # 周趋势图
│   │   ├── TaskList.tsx           # 任务管理列表
│   │   ├── MilestonePanel.tsx     # 里程碑规划面板
│   │   ├── KegelGuide.tsx         # Kegel 运动引导 UI
│   │   ├── KegelPopup.tsx         # Kegel 弹窗子窗口
│   │   ├── RestActivityGuide.tsx  # 休息活动引导
│   │   ├── RestPreferenceDialog.tsx # 首次偏好选择
│   │   ├── ReportPanel.tsx        # 日报/周报展示
│   │   ├── WeeklyReportModal.tsx  # 周报弹窗
│   │   ├── NewsModal.tsx          # AI 精编新闻弹窗
│   │   └── NewsTickerBar.tsx      # 新闻滚动条
│   ├── hooks/
│   │   ├── useTimer.ts            # 计时器核心调度
│   │   ├── useKegel.ts            # Kegel 运动状态机
│   │   └── useTheme.ts            # 主题切换
│   ├── store/
│   │   ├── timerStore.ts          # 计时器 + 设置状态
│   │   ├── taskStore.ts           # 任务 + 每日统计
│   │   ├── milestoneStore.ts      # 里程碑状态
│   │   └── reportStore.ts         # 报告状态
│   ├── utils/
│   │   ├── storage.ts             # localStorage 持久化
│   │   ├── fileStorage.ts         # Tauri FS 文件持久化
│   │   ├── audio.ts               # Web Audio API 声音生成
│   │   ├── aiNews.ts              # AI 新闻集成
│   │   ├── deepseek.ts            # DeepSeek API 客户端
│   │   ├── reportPrompts.ts       # 报告生成模板
│   │   └── restActivities.ts      # 休息活动辅助函数
│   └── assets/
│       └── hero.png
├── src-tauri/                     # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs                # 桌面入口
│   │   └── lib.rs                 # Tauri 配置、托盘、Kegel 弹窗指令
│   ├── icons/                     # 应用图标（全平台）
│   ├── tauri.conf.json            # Tauri 配置
│   └── Cargo.toml                 # Rust 依赖
├── public/
│   ├── favicon.svg                # 网站图标
│   └── icons.svg                  # 图标合图
├── docs/                          # 设计文档和计划
│   └── superpowers/
├── .github/workflows/
│   └── build-mac.yml              # macOS DMG 构建工作流
├── package.json
├── vite.config.ts
├── tsconfig.json
└── eslint.config.js
```

## macOS 打包

本项目包含 [GitHub Actions 工作流](.github/workflows/build-mac.yml)，可在没有 Mac 的情况下自动构建 macOS 版本：

1. 推送到 GitHub
2. 进入 **Actions** → **Build Mac DMG** → **Run workflow**
3. 下载构建完成的 `.dmg` 文件

有 Mac 也可手动构建：

```bash
npm run tauri:build -- --bundles dmg
```

## 贡献指南

请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解行为准则和提交 Pull Request 的流程。

## 行为准则

所有贡献者应遵守 [行为准则](./CODE_OF_CONDUCT.md)。

## 变更日志

详见 [CHANGELOG.md](./CHANGELOG.md)。

## 许可证

本项目采用 MIT 许可证——详见 [LICENSE](./LICENSE) 文件。

## 致谢

- 灵感来自 Francesco Cirillo 的番茄工作法®
- 基于 [Tauri](https://tauri.app/)、[React](https://react.dev/) 和 [TypeScript](https://www.typescriptlang.org/) 构建
- 图标来自 [Phosphor Icons](https://phosphoricons.com/)
