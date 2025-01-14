import { precacheAndRoute } from "workbox-precaching";

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
});

// 使用 Workbox 预缓存和路由
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("fetch", (event) => {
  console.log("Fetching:", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // 返回缓存的资源
      }
      return fetch(event.request).then((response) => {
        // 检查是否是有效的响应
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // 克隆响应
        const responseToCache = response.clone();

        // 将响应添加到缓存中
        caches.open("my-cache-v1").then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
