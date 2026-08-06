import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// v1: 단일 페이지 앱. 서버/외부 API 없음. 저장은 localStorage.
export default defineConfig({
  plugins: [react()],
});
