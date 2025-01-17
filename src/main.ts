import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import fontAwesomeLibrary from "./utils/fontAwesomeLibrary";
fontAwesomeLibrary();

// import { listS3Objects } from "./imagehosting/test";

// console.log(listS3Objects);
// listS3Objects("blog-image-1303709080", "/system_images");

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.mount("#app");
