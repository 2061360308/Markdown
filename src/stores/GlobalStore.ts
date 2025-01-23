import { defineStore } from "pinia";
import { Ref, ref } from "vue";
import { useRouter } from "vue-router";

export const useGlobalStore = defineStore("global", () => {
  const router = useRouter();

  const repoName: Ref<string> = ref("");  // 仓库名称
  
  const goLogin = () => {
    localStorage.removeItem("jumpLogin");  // 清除跳过登录标记
    router.replace({ name: "login" });
  };

  return {
    goLogin,
  };
});
