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
