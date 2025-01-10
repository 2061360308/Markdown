import "./assets/main.css";

import { createApp, ref } from "vue";
import App from "./App.vue";
import router from './router';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "element-plus/dist/index.css";
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import fontAwesomeLibrary from "./utils/fontAwesomeLibrary";

// 读取配置文件
const loadConfig = async (app) => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`);;
    let config = await response.json();
    app.config.globalProperties.$globalConfig.value = config; // 将全局变量添加到全局属性上
  } catch (error) {
    console.error("Error loading config:", error);
    throw error;
  }
};

const login = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const repo = urlParams.get("repo");
  console.log("code", code);
};

login();

const app = createApp(App);
app.use(router);
app.config.globalProperties.$globalConfig = ref(null);
console.log("globalConfig", app.config.globalProperties.$globalConfig);
loadConfig(app);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.mount("#app");
