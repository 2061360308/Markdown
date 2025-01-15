import { defineStore } from "pinia";
import { ref, Ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

export const useGlobalStore = defineStore("global", () => {
  const goLogin = () => {
    router.replace({ name: "login" });
  };

  return {
    goLogin,
  };
});
