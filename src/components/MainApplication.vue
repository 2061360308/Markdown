<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import FileTree from "./FileTree.vue";
import WorkSpace from "./WorkSpace.vue";
import SearchManager from "./SearchManager.vue";
import DiffManager from "./DiffManager.vue";
import EditingManager from "./EditingManager.vue";
import AboutApp from "./AboutApp.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import api from "@/utils/api";
import { useTabsStore, useSettingsStore } from "@/stores";
import imagehosting from "@/utils/imagehosting";
import { ElNotification } from "element-plus";

const tabsStore = useTabsStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const leftPaneSize = ref(20);
const activeMenu = ref("files");
const aboutDialogVisible = ref(false);

const pingGitHub = async (): Promise<boolean> => {
  try {
    const response = await fetch("https://api.github.com/");
    console.log("GitHub response:", response);
    return response.ok;
  } catch (error) {
    console.error("Error pinging GitHub:", error);
    return false;
  }
};

onMounted(async () => {
  if (!api.ready) {
    // 判断是否是跳过登录的情况(已经启用离线模式或之前没有登录过，没有loginMethod标识)
    if (!localStorage.getItem("jumpLogin") && localStorage.getItem("loginMethod")) {
      // 这里检查是否能够正常访问Github【只检查api.github.com】
      if ((await pingGitHub())) {
        router.push({ name: "login" });
      } else {
        ElNotification({
          title: "Info",
          message: "当前无法访问Github，已自动为您启用离线模式。",
          type: "info",
        });
        localStorage.setItem("jumpLogin", "true");
      }
    }
  } else {
    // 尝试初始化 图床配置
    imagehosting.init(
      settingsStore.settings["图床配置"].bucket,
      settingsStore.settings["图床配置"].endpoint,
      settingsStore.settings["图床配置"].region,
      settingsStore.settings["图床配置"].accessKeyId,
      settingsStore.settings["图床配置"].secretAccessKey
    );
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
    case Menu.About:
      aboutDialogVisible.value = true;
      break;
    case Menu.Settings:
      tabsStore.addTab(
        tabsStore.TabType.SettingsPanel,
        "gear",
        { title: "设置" },
        "setting"
      ); // 打开设置面板页
      break;
  }
};

interface LaunchParams {
  files: FileSystemFileHandle[];
}

if (
  "launchQueue" in window &&
  "files" in (window as any).LaunchParams.prototype
) {
  const launchQueue = (window as any).launchQueue;
  launchQueue.setConsumer(async (launchParams: { files: string | any[] }) => {
    // Nothing to do when the queue is empty.
    if (!launchParams.files.length) {
      return;
    }
    for (const fileHandle of launchParams.files) {
      tabsStore.openNativeFile(fileHandle);
    }
  });
}
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
        <SearchManager v-else-if="activeMenu == Menu.Search" />
        <DiffManager v-else-if="activeMenu == Menu.Changes" />
      </pane>
      <pane :size="100 - leftPaneSize">
        <WorkSpace />
      </pane>
    </splitpanes>
    <AboutApp v-model:show="aboutDialogVisible" />
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
