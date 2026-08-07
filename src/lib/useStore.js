import { useSyncExternalStore } from "react";
import { subscribe, getState } from "./storage.js";

/* 저장소 전체 상태를 구독. 변경 시 리렌더. */
export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}
