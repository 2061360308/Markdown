<script setup>
import { ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import EventBus from "@/eventBus";

const changesFlag = ref(false);
const lastSaveTime = ref('');
const totalWordsNum = ref(0);

EventBus.on("file-saved", () => {
  changesFlag.value = false;
  lastSaveTime.value = new Date().toLocaleString();
});

EventBus.on("file-changed", (num) => {
  changesFlag.value = true;

});
</script>

<template>
  <div class="status-bar">
    <div class="status-bar-left">
      <div class="status-bar-item">
        <div class="icon">
          <FontAwesomeIcon :icon="['fas', 'file-shield']" />
        </div>
        <span>master</span>
      </div>
      <div class="status-bar-item">
        <div class="icon">
          <font-awesome-icon :icon="['fas', 'won-sign']" />
        </div>
        <span>总字数：{{ totalWordsNum }}</span>
      </div>
      <div class="status-bar-item">
        <div class="icon">
          <font-awesome-icon :icon="['fas', 'floppy-disk']" />
        </div>
        <span>上次保存时间：{{ lastSaveTime }}</span>
      </div>
    </div>
    <div class="status-bar-right">
      <div class="status-bar-item">
        <div class="changes" v-if="changesFlag">
          <span class="icon">
            <font-awesome-icon
              style="color: var(--el-color-danger)"
              :icon="['fas', 'circle-exclamation']"
            />
          </span>
          <span>更改未保存</span>
        </div>
        <div class="all-saved" v-else>
          <span class="icon">
            <font-awesome-icon
              style="color: var(--el-color-success)"
              :icon="['fas', 'circle-check']"
            />
          </span>
          <span>已保存</span>
        </div>
      </div>
      <div class="status-bar-item">行:111 列:58</div>
      <div class="status-bar-item">空格: 4</div>
      <div class="status-bar-item">UTF-8</div>
      <div class="status-bar-item">CRLF</div>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  height: 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  background-color: var(--el-color-primary);
  color: var(--el-color-secondary-text);
}

.status-bar-item {
  display: flex;
  align-items: center;
  /* 鼠标指针 */
  cursor: pointer;
  /* 文字不能复制 */
  user-select: none;
  font-size: 14px;
  padding: 0 5px;
  margin: 0 10px;
  color: var(--el-color-white);
}

.status-bar-item:hover {
  background-color: var(--el-color-primary-light-7);
  color: var(--el-color-secondary-text);
}

.status-bar-item .icon {
  margin-right: 5px;
}

.status-bar-left,
.status-bar-right {
  display: flex;
}

.status-bar-left {
  justify-content: flex-start;
}

.status-bar-right {
  justify-content: flex-end;
}
</style>
