import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// v1: 단일 페이지 앱. 서버/외부 API 없음. 저장은 localStorage.
// GitHub Pages 배포 시 하위 경로(/-/)로 서빙되므로 PAGES_BASE로 base를 넘긴다.
// 기본값 "/" — 로컬 개발·Netlify·zip 배포는 루트 서빙.
export default defineConfig({
  base: process.env.PAGES_BASE || "/",
  plugins: [react()],
});
