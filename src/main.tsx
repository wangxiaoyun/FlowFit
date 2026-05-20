import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import KegelPopup from "./components/KegelPopup";
import "./index.css";

// Tauri 子窗口通过 URL 查询参数区分渲染目标
const params = new URLSearchParams(window.location.search);
const popupType = params.get("popup");
const root = document.getElementById("root")!;

if (popupType === "kegel") {
  const reps = parseInt(params.get("reps") ?? "5", 10);
  const holdSeconds = parseInt(params.get("hold") ?? "5", 10);
  createRoot(root).render(
    <StrictMode>
      <KegelPopup reps={reps} holdSeconds={holdSeconds} />
    </StrictMode>
  );
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
