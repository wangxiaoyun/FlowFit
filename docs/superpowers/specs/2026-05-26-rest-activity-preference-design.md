# 休息活动偏好设计

## 背景

当前 FlowFit 在专注结束后默认引导“提肛练习”，并在设置、通知、Tauri 弹窗、引导卡中使用提肛相关文案。这个设计对一部分用户有价值，但作为唯一默认休息活动容易显得过度医疗化，也不适合用性别做强绑定。

本次采用“不收集性别，只收集休息偏好”的方案。首次进入系统时弹出休息偏好选择，允许跳过；偏好存入本地设置，后续可在设置页修改。

## 目标

1. 首次进入主页面时，如果没有休息偏好记录，展示“选择休息方式”弹窗。
2. 弹窗允许选择“轻运动”“呼吸放松”“盆底肌训练”或“暂不选择”。
3. 休息偏好保存到 `pomodoro-settings`，旧设置可兼容迁移。
4. 设置页可修改休息活动；只有选择“盆底肌训练”时显示组数和保持秒数。
5. 专注结束后根据休息偏好触发对应活动；跳过/不选择时只进入普通休息。
6. 移除面向主流程的“提肛”强默认文案，改为“盆底肌训练”或更通用的休息活动文案。

## 非目标

1. 不收集性别。
2. 不做医学评估、健康问卷或个性化诊断。
3. 不引入复杂动作库；轻运动和呼吸放松先用固定短流程。
4. 不改变任务、周报、日报逻辑。

## 数据模型

在 `Settings` 中新增：

```ts
export type RestActivityType = "stretch" | "breathing" | "pelvicFloor" | "none";

interface Settings {
  restPreferenceSet: boolean;
  restActivityType: RestActivityType;
}
```

兼容策略：

- 新用户默认 `restPreferenceSet: false`，`restActivityType: "stretch"`。
- 旧用户如果没有新字段且 `kegelEnabled === true`，迁移为 `restPreferenceSet: true`、`restActivityType: "pelvicFloor"`，保持原行为。
- 旧用户如果没有新字段且 `kegelEnabled === false`，迁移为 `restPreferenceSet: true`、`restActivityType: "none"`。
- 保留 `kegelReps` 和 `kegelHoldSeconds` 作为盆底肌训练参数，减少迁移风险。

## 用户体验

首次偏好弹窗：

- 标题：`选择休息方式`
- 说明：`用于在专注结束后推荐合适的短休息活动，可随时在设置中修改。`
- 选项：
  - `轻运动`：肩颈、肩胛、髋部、脚踝循环等温和活动。
  - `呼吸放松`：短呼吸节奏，低打扰。
  - `盆底肌训练`：原提肛练习的中性命名。
  - `暂不选择`：保存为不弹活动引导，进入普通休息。

设置页：

- 将“专注结束时提肛提醒”替换为“休息活动”。
- 使用分段按钮或单选卡选择 `stretch`、`breathing`、`pelvicFloor`、`none`。
- 只有 `pelvicFloor` 显示组数和保持秒数。

活动引导：

- `stretch`：展示轻运动引导卡，使用固定 3 步：肩颈放松、肩胛后收、脚踝绕环。
- `breathing`：展示呼吸放松引导卡，使用固定节奏。
- `pelvicFloor`：复用现有计时逻辑和参数，文案改成“盆底肌训练”。
- `none`：不打开活动弹窗，直接进入休息阶段。

## 技术设计

新增或调整文件：

- `src/types/index.ts`：新增 `RestActivityType` 和设置字段。
- `src/constants/index.ts`：新增默认设置字段。
- `src/store/timerStore.ts`：加载设置时做兼容迁移。
- `src/utils/restActivities.ts`：集中定义活动类型、显示文案、默认引导步骤和迁移辅助函数。
- `src/components/RestPreferenceDialog.tsx`：首次进入偏好弹窗。
- `src/components/RestActivityGuide.tsx`：通用休息活动引导卡。
- `src/components/KegelGuide.tsx`：改为复用或转接到通用活动卡，保留盆底肌训练倒计时。
- `src/components/KegelPopup.tsx`：根据传入活动类型渲染对应活动。
- `src/hooks/useTimer.ts`：专注结束时按 `restActivityType` 判断是否打开活动弹窗。
- `src/components/Header.tsx`：设置页增加休息活动配置。
- `src/main.tsx` 和 Tauri invoke 参数：弹窗页读取活动类型、组数和保持秒数。

## 测试策略

1. 单元测试设置迁移：
   - 新用户默认 `restPreferenceSet: false`。
   - 旧用户 `kegelEnabled: true` 迁移到 `pelvicFloor`。
   - 旧用户 `kegelEnabled: false` 迁移到 `none`。
2. 组件测试：
   - `RestPreferenceDialog` 点击“暂不选择”保存 `none`。
   - 设置页选择 `pelvicFloor` 时显示组数和保持秒数。
3. 构建验证：
   - `npm test`
   - `npm run build`

## 风险

1. Tauri 弹窗命令名仍叫 `show_kegel_popup`，短期可保留以控制改动面，前端文案改为通用休息活动。
2. 现有 lint 配置会扫描生成目录并报已有问题，本次以单测和构建为主要验证。
3. 轻运动和呼吸引导不应给出医学承诺，只表达为短休息建议。
