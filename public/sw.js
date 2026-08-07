/* Think in English — 서비스 워커
   앱 셸을 캐시해 오프라인에서도 열리게 한다.
   - HTML(내비게이션): 네트워크 우선(최신 배포 반영), 실패 시 캐시.
   - 정적 자산(JS/CSS/이미지): 캐시 우선.
   - AI 함수(/.netlify/...): 절대 캐시하지 않음. */
const CACHE = "tie-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // AI/서버리스 함수: 항상 네트워크
  if (url.pathname.startsWith("/.netlify/")) return;

  // 내비게이션 요청: 네트워크 우선
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r || caches.match("/")))
    );
    return;
  }

  // 같은 오리진 정적 자산: 캐시 우선
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            }
            return res;
          })
      )
    );
  }
});
