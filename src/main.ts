import "./assets/main.css";

import { createApp, ref } from "vue";
import App from "./App.vue";
import router from './router';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "element-plus/dist/index.css";
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import fontAwesomeLibrary from "./utils/fontAwesomeLibrary";
fontAwesomeLibrary();

const app = createApp(App);
app.use(router);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.mount("#app");
