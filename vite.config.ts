import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from 'path';
import { copyFileSync } from 'fs';
import vueDevTools from "vite-plugin-vue-devtools";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// 自定义插件，用于在构建后复制 404.html 文件
function copy404Plugin() {
  return {
    name: "copy-404",
    closeBundle() {
      const src = resolve(__dirname, "404.html");
      const dest = resolve(__dirname, "dist", "404.html");
      copyFileSync(src, dest);
      console.log("404.html 文件已复制到构建输出目录");
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    copy404Plugin(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    extensions: [".js", ".vue", ".json", ".ts"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
