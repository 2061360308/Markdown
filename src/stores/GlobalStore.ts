import { defineStore } from "pinia";
import { useRouter } from "vue-router";

export const useGlobalStore = defineStore("global", () => {
  const router = useRouter();
  
  const goLogin = () => {
    localStorage.removeItem("jumpLogin");  // 清除跳过登录标记
    router.replace({ name: "login" });
  };

  return {
    goLogin,
  };
});
