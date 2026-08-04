import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

/* ------------------------------------------------------------------
   window.storage 심(shim)
   원본 컴포넌트는 Artifacts 환경의 비동기 window.storage API를 씁니다.
   ( get(key) → { value }, set(key, value) )
   일반 브라우저에는 없으므로 localStorage로 같은 계약을 흉내 냅니다.
   모든 호출이 try/catch로 감싸져 있어, 이게 없어도 앱은 동작하되
   기록이 저장되지 않습니다. 심을 두어 실제로 유지되게 합니다.
------------------------------------------------------------------ */
if (!window.storage) {
  window.storage = {
    async get(key) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? null : { value };
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* 저장 실패해도 앱은 계속 동작 */
      }
      return true;
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
