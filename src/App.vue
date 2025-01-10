<script setup>
import { ref, onMounted, getCurrentInstance, watch } from "vue";
import { ElLoading } from "element-plus";
import { ElMessageBox, ElMessage, ElInput } from "element-plus";
import { encryptToken, decryptToken } from "./utils/encryptToken";
import { testToken, createOctokit } from "./utils/githubApi";
import MainApplication from "./components/MainApplication.vue";

import api from "@/utils/githubFs/api";

const config = ref({});

const password = ref("");

const { appContext } = getCurrentInstance();

// onMounted(() => {
//   console.log("mounted");
//   const loading = ElLoading.service({
//     lock: true,
//     text: "Loading",
//     background: "rgba(0, 0, 0, 0.7)",
//   });

//   watch(
//     appContext.config.globalProperties.$globalConfig,
//     (newVal, oldVal) => {
//       if (newVal != null) {
//         console.log("newVal:", newVal);
//         config.value = newVal;
//         loading.close();
//       }
//     },
//     { deep: true }
//   );
// });

// const genderNewToken = () => {
//   const token = ref("");
//   const password = ref("");

//   ElMessageBox({
//     title: "请输入你的Github Token和密码",
//     message: `
//       <div style="width: 100%;">
//         <div style="margin-bottom: 10px; width: 100%;">
//           <span>Token: </span>
//           <input id="token-input" type="text" style="width: 100%; padding: 5px; margin-top: 5px;" />
//         </div>
//         <div>
//           <span>密码: </span>
//           <input id="password-input" type="password" style="width: 100%; padding: 5px; margin-top: 5px;" />
//         </div>
//       </div>
//     `,
//     dangerouslyUseHTMLString: true,
//     confirmButtonText: "确认",
//     cancelButtonText: "取消",
//     beforeClose: (action, instance, done) => {
//       if (action === "confirm") {
//         const tokenValue = document.getElementById("token-input").value;
//         const passwordValue = document.getElementById("password-input").value;
//         if (!tokenValue || !passwordValue) {
//           ElMessage({
//             type: "error",
//             message: "Token和密码不能为空",
//           });
//           return;
//         }
//         token.value = tokenValue;
//         password.value = passwordValue;
//         done();
//       } else {
//         done();
//       }
//     },
//   })
//     .then(async () => {
//       try {
//         const gender_token = await encryptToken(token.value, password.value);
//         console.log(gender_token);
//         navigator.clipboard.writeText(gender_token);
//         ElMessage({
//           type: "success",
//           message: `加密后的Token为${gender_token},已复制到剪贴板`,
//         });
//       } catch (error) {
//         console.error("加密失败:", error);
//         ElMessage({
//           type: "error",
//           message: "加密失败",
//         });
//       }
//     })
//     .catch(() => {
//       ElMessage({
//         type: "info",
//         message: "取消输入",
//       });
//     });
// };

// const login = async () => {
//   console.log("login");
//   let result = decryptToken(appContext.config.globalProperties.$globalConfig.value.token, password.value);

//   let test_result = await testToken(result);
//   if (test_result) {
//     console.log("保存的值", appContext.config.globalProperties.$globalConfig.value);

//     let owner = appContext.config.globalProperties.$globalConfig.value.owner;
//     let repo = appContext.config.globalProperties.$globalConfig.value.repo;
//     let token = result;
//     api.init(owner, repo, token).then(() => {
//       console.log("初始化成功", {owner, repo, token});
//       config.value = true;
//       appContext.config.globalProperties.$globalConfig.value.token_decrypt = result;
//     });
//   } else {
//     ElMessage({
//       type: "error",
//       message: "密码错误",
//     });
//   }
// };
</script>

<template>
  <router-view></router-view>
</template>
