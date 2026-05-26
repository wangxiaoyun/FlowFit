import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RestPreferenceDialog } from "./RestPreferenceDialog";

describe("RestPreferenceDialog", () => {
  it("offers rest activity choices and a skip option", () => {
    const markup = renderToStaticMarkup(
      <RestPreferenceDialog onSelect={() => {}} />
    );

    expect(markup).toContain("选择休息方式");
    expect(markup).toContain("轻运动");
    expect(markup).toContain("呼吸放松");
    expect(markup).toContain("盆底肌训练");
    expect(markup).toContain("暂不选择");
  });
});
