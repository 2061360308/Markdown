<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes";
import { ref, onMounted } from "vue";

import FileTree from "./FileTree.vue";
import WorkSpace from "./WorkSpace.vue";
import DiffManager from "./DiffManager.vue";
import EditingManager from "./EditingManager.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import api from "@/utils/api";
import { useTabsStore } from "@/stores";

const tabsStore = useTabsStore();

const leftPaneSize = ref(20);
const activeMenu = ref("files");

onMounted(async () => {
  if (!api.ready) {
    // router.push({ name: "login" });
    // 加载远程配置
  }
});

// Menu enum
enum Menu {
  Null = "",
  Files = "files",
  Editing = "editing",
  Search = "search",
  Changes = "changes",
  About = "about",
  Settings = "settings",
}

const handleMenuSelect = (index: string) => {
  index as Menu;

  // Close the menu if it's already open
  if (activeMenu.value === index) {
    activeMenu.value = Menu.Null;
    leftPaneSize.value = 0;
    return;
  }

  // Open the menu
  if (leftPaneSize.value === 0) {
    leftPaneSize.value = 20;
  }

  // Set the active menu
  switch (index) {
    case Menu.Files:
      activeMenu.value = Menu.Files;
      break;
    case Menu.Editing:
      activeMenu.value = Menu.Editing;
      break;
    case Menu.Search:
      activeMenu.value = Menu.Search;
      break;
    case Menu.Changes:
      activeMenu.value = Menu.Changes;
      break;
    case Menu.Settings:
      tabsStore.addTab(tabsStore.TabType.SettingsPanel, "gear", {title: "设置"}); // 打开设置面板页
      break;
  }
};
</script>

<template>
  <div class="main">
    <el-menu
      class="slider-menu-bar"
      :default-active="activeMenu"
      :collapse="true"
      @select="handleMenuSelect"
    >
      <div class="items-top">
        <el-menu-item :index="Menu.Files">
          <font-awesome-icon :icon="['fas', 'file']" size="2xl" />
          <template #title>资源管理器</template>
        </el-menu-item>
        <el-menu-item :index="Menu.Editing">
          <font-awesome-icon :icon="['fas', 'inbox']" size="2xl" />
          <template #title>当前编辑</template>
        </el-menu-item>
        <el-menu-item :index="Menu.Search">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" size="2xl" />
          <template #title>搜索</template>
        </el-menu-item>
        <el-menu-item :index="Menu.Changes">
          <font-awesome-icon :icon="['fas', 'code-branch']" size="2xl" />
          <template #title>本地更改</template>
        </el-menu-item>
      </div>
      <div class="items-bottom">
        <el-menu-item :index="Menu.About">
          <font-awesome-icon :icon="['fas', 'circle-question']" size="2xl" />
          <template #title>关于</template>
        </el-menu-item>
        <el-menu-item :index="Menu.Settings">
          <font-awesome-icon :icon="['fas', 'gear']" size="2xl" />
          <template #title>设置</template>
        </el-menu-item>
      </div>
    </el-menu>

    <splitpanes>
      <pane
        :size="leftPaneSize"
        v-if="activeMenu !== Menu.Null"
        class="slider_panel"
      >
        <FileTree v-if="activeMenu == Menu.Files" />
        <EditingManager v-else-if="activeMenu == Menu.Editing" />
        <DiffManager v-else-if="activeMenu == Menu.Changes" />
      </pane>
      <pane :size="100 - leftPaneSize">
        <WorkSpace />
      </pane>
    </splitpanes>
  </div>
</template>

<style>
@import "splitpanes/dist/splitpanes.css";

.splitpanes__splitter {
  width: 1px;
  padding: 0 2px;
  background-color: var(--el-border-color-dark);
  position: relative;
}

.splitpanes__splitter:hover {
  width: 5px;
  background-color: var(--el-color-primary);
}
</style>

<style scoped>
.main {
  display: flex;
  width: 100%;
  height: 100vh;
}

.splitpanes {
  width: calc(100% - 54px);
  height: 100%;
}

.slider-menu-bar {
  display: flex;
  justify-content: space-between;
  justify-items: center;
  flex-direction: column;
}

.slider_panel {
  min-width: 300px;
}

.el-menu--collapse {
  --el-menu-base-level-padding: 15px;
}
</style>
