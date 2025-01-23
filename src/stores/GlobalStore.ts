import { defineStore } from "pinia";
import { useRouter } from "vue-router";

export const useGlobalStore = defineStore("global", () => {
  const router = useRouter();
  
  const goLogin = () => {
    router.replace({ name: "login" });
  };

  return {
    goLogin,
  };
});
