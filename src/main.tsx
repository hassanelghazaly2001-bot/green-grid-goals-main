console.log("APP IS STARTING...");
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/global-error-guard";
import "./lib/safe-share-modal";

try {
  const el = document.getElementById("root");
  if (el) {
    createRoot(el).render(<App />);
  } else {
    console.error("APP START ERROR: #root not found");
  }
} catch (err) {
  console.error("APP START ERROR:", err);
  try {
    setTimeout(() => {
      const el2 = document.getElementById("root");
      if (el2) {
        createRoot(el2).render(<App />);
      }
    }, 0);
  } catch (e) {
    console.error("APP RETRY ERROR:", e);
  }
}
