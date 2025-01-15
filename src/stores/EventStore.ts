import { defineStore } from "pinia";
import { ref, Ref, watch } from "vue";

export const useEventStore = defineStore("event", () => {
  const fileChanged = ref("");
  
  return {
    fileChanged,
  };
});
