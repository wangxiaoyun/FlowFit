import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RestActivityGuide } from "./RestActivityGuide";

describe("RestActivityGuide", () => {
  it("renders stretch guidance", () => {
    const markup = renderToStaticMarkup(
      <RestActivityGuide
        activityType="stretch"
        reps={10}
        holdSeconds={3}
        onDone={() => {}}
        onSkip={() => {}}
      />
    );

    expect(markup).toContain("轻运动");
    expect(markup).toContain("肩颈放松");
  });

  it("renders breathing guidance", () => {
    const markup = renderToStaticMarkup(
      <RestActivityGuide
        activityType="breathing"
        reps={10}
        holdSeconds={3}
        onDone={() => {}}
        onSkip={() => {}}
      />
    );

    expect(markup).toContain("呼吸放松");
    expect(markup).toContain("吸气");
  });
});
