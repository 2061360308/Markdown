import { defineStore } from "pinia";
import { ref, Ref } from "vue";
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
