import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { useTimerStore } from "../store/timerStore";
import { Header } from "./Header";

beforeEach(() => {
  useTimerStore.setState((state) => ({
    settings: {
      ...state.settings,
      deepseekApiKey: "",
    },
  }));
});

describe("Header", () => {
  it("shows the report management button even when DeepSeek API Key is not configured", () => {
    const markup = renderToStaticMarkup(<Header />);

    expect(markup).toContain("日报 / 周报管理");
  });
});
