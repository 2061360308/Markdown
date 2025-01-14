<script setup lang="ts">
import { ElTabs, ElTabPane, TabPaneName } from "element-plus";
import MdEditor from "./MdEditor.vue";
import SettingsPanel from "./SettingsPanel.vue";
import { useTabsStore } from "@/stores";

const tabsStore = useTabsStore();
</script>

<template>
  <div class="workspace">
    <el-tabs
      v-model="tabsStore.activeTabId"
      type="card"
      closable
      @tab-remove="tabsStore.removeTab"
      class="el-tabs"
      v-if="tabsStore.tabs.length > 0"
    >
      <el-tab-pane
        v-for="item in tabsStore.tabs"
        :key="item.id"
        :label="item.data.title"
        :name="item.id"
        class="tab-pane"
      >
        <template #label>
          <font-awesome-icon
            :icon="['fas', item.icon]"
            style="padding-right: 2px"
          />
          {{ item.data.title }}
        </template>
        <MdEditor
          :editor="item.id"
          :path="item.data.path"
          v-if="item.type === tabsStore.TabType.MdFile"
        />
        <SettingsPanel
          v-else-if="item.type === tabsStore.TabType.SettingsPanel"
        />
      </el-tab-pane>
    </el-tabs>
    <div class="empty-box" v-else>
      <el-empty>
        <template #description>
          <span>请在左侧文件管理器中选择文件打开</span>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<style>
.el-tabs__header {
  margin: 0 !important;
}
</style>

<style scoped>
.workspace {
  width: 100%;
  height: 100vh;
}

.el-tabs {
  height: 100%;
}

.empty-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
