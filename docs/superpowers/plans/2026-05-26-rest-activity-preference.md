# Rest Activity Preference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded post-focus pelvic-floor prompt with a first-run rest activity preference that can be skipped and later changed in settings.

**Architecture:** Add a small rest activity model in `src/utils/restActivities.ts`, persist selected activity in the existing timer settings store, and route the existing Tauri popup through a generic rest activity guide. Keep the existing pelvic-floor timer parameters for backward compatibility.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Vite, Tauri invoke parameters.

---

### Task 1: Rest Activity Model and Migration

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/constants/index.ts`
- Create: `src/utils/restActivities.ts`
- Test: `src/utils/restActivities.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { normalizeRestSettings } from "./restActivities";

describe("normalizeRestSettings", () => {
  it("leaves new users without a completed preference selection", () => {
    expect(normalizeRestSettings({})).toMatchObject({
      restPreferenceSet: false,
      restActivityType: "stretch",
    });
  });

  it("migrates old enabled pelvic-floor settings to pelvicFloor", () => {
    expect(normalizeRestSettings({ kegelEnabled: true })).toMatchObject({
      restPreferenceSet: true,
      restActivityType: "pelvicFloor",
    });
  });

  it("migrates old disabled pelvic-floor settings to none", () => {
    expect(normalizeRestSettings({ kegelEnabled: false })).toMatchObject({
      restPreferenceSet: true,
      restActivityType: "none",
    });
  });
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- src/utils/restActivities.test.ts`
Expected: fail because `src/utils/restActivities.ts` does not exist.

- [ ] **Step 3: Implement model**

Add `RestActivityType`, default settings fields, `REST_ACTIVITY_OPTIONS`, and `normalizeRestSettings`.

- [ ] **Step 4: Run green test**

Run: `npm test -- src/utils/restActivities.test.ts`
Expected: 3 tests pass.

### Task 2: First-Run Preference Dialog

**Files:**
- Create: `src/components/RestPreferenceDialog.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/RestPreferenceDialog.test.tsx`

- [ ] **Step 1: Write failing test**

Render the dialog, click “暂不选择”, and assert callback receives `"none"`.

- [ ] **Step 2: Run red test**

Run: `npm test -- src/components/RestPreferenceDialog.test.tsx`
Expected: fail because component does not exist.

- [ ] **Step 3: Implement component and App wiring**

Show the dialog when `settings.restPreferenceSet === false`. Saving any option updates `restPreferenceSet: true` and `restActivityType`.

- [ ] **Step 4: Run green test**

Run: `npm test -- src/components/RestPreferenceDialog.test.tsx`
Expected: dialog test passes.

### Task 3: Generic Rest Activity Guide

**Files:**
- Create: `src/components/RestActivityGuide.tsx`
- Modify: `src/components/KegelPopup.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write failing test**

Render `RestActivityGuide` with `activityType="stretch"` and assert it shows “轻运动”.

- [ ] **Step 2: Run red test**

Run: `npm test -- src/components/RestActivityGuide.test.tsx`
Expected: fail because component does not exist.

- [ ] **Step 3: Implement guide**

Support `stretch`, `breathing`, and `pelvicFloor`; keep existing `KegelGuide` behavior for `pelvicFloor`.

- [ ] **Step 4: Run green test**

Run: `npm test -- src/components/RestActivityGuide.test.tsx`
Expected: activity guide test passes.

### Task 4: Timer and Settings Integration

**Files:**
- Modify: `src/hooks/useTimer.ts`
- Modify: `src/components/Header.tsx`
- Test: existing and new Vitest tests

- [ ] **Step 1: Write failing tests or extend existing tests**

Verify settings can select `none`, `stretch`, `breathing`, and `pelvicFloor`; verify `none` prevents activity popup routing.

- [ ] **Step 2: Implement routing and settings UI**

Use `restActivityType` instead of `kegelEnabled` for the post-focus popup decision. Show pelvic-floor parameters only for `pelvicFloor`.

- [ ] **Step 3: Verify**

Run: `npm test`
Expected: all tests pass.

Run: `npm run build`
Expected: production build passes.
