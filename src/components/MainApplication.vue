<script setup>
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import { ref } from "vue";

import FileTree from "./FileTree.vue";
import WorkSpace from "./WorkSpace.vue";
import StatusBar from "./StatusBar.vue";
import DiffManager from "./DiffManager.vue";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faFileShield,
  faFile,
  faMagnifyingGlass,
  faCodeBranch,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faFileShield, faFile, faMagnifyingGlass, faCodeBranch, faGear);

const leftPaneSize = ref(20);
const activeMenu = ref("files");

const handleMenuSelect = (index) => {
  console.log("index:", index);
  if (activeMenu.value === index) {
    console.log("activeMenu.value === index");
    activeMenu.value = "";
    leftPaneSize.value = 0;
    return;
  }

  if (leftPaneSize.value === 0) {
    leftPaneSize.value = 20;
  }

  switch (index) {
    case "files":
      activeMenu.value = "files";
      break;
    case "search":
      activeMenu.value = "search";
      break;
    case "changes":
      activeMenu.value = "changes";
      break;
    case "settings":
      activeMenu.value = "settings";
      break;
  }
};
</script>

<template>
  <div class="top-bottom">
    <div class="left-right">
      <el-menu
        class="el-menu-vertical-demo"
        :default-active="activeMenu"
        :collapse="true"
        @select="handleMenuSelect"
      >
        <el-menu-item index="files">
          <font-awesome-icon :icon="['fas', 'file']" size="2xl" />
          <template #title>资源管理器</template>
        </el-menu-item>
        <el-menu-item index="search">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" size="2xl" />
          <template #title>搜索</template>
        </el-menu-item>
        <el-menu-item index="changes">
          <font-awesome-icon :icon="['fas', 'code-branch']" size="2xl" />
          <template #title>本地更改</template>
        </el-menu-item>
        <el-menu-item index="settings">
          <font-awesome-icon :icon="['fas', 'gear']" size="2xl" />
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>

      <splitpanes class="default-theme">
        <pane :size="leftPaneSize">
          <FileTree v-if="activeMenu=='files'" />
          <DiffManager v-else-if="activeMenu=='changes'" />
        </pane>
        <pane :size="100 - leftPaneSize">
          <WorkSpace />
        </pane>
      </splitpanes>
    </div>
    <StatusBar />
  </div>
</template>

<style scoped>
.top-bottom {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.left-right {
  display: flex;
  width: 100%;
  height: calc(100vh - 20px);
}

.splitpanes {
  width: calc(100% - 54px);
  height: 100%;
}

.el-menu--collapse {
  --el-menu-base-level-padding: 15px;
}
</style>
