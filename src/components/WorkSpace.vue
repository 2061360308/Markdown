<script setup lang="ts">
import { ref, nextTick, Ref } from "vue";
import { ElTabs, ElTabPane, TabPaneName } from "element-plus";
import MdEditor from "./MdEditor.vue";
import { EventBusType, EventBus } from "@/eventBus";

const tabs = ref<{ title: string; path: string; name: string }[]>([]); // [{ title: 'Tab 1', path:'', name: '1' }, ...]

let tabsWidgets: { [key: string]: any } = {};

const currentTabsValue: Ref<string> = ref("");

const removeTab = (targetName: TabPaneName) => {
  const _tabs = tabs.value;
  let activeName = currentTabsValue.value;

  if (activeName === targetName) {
    tabs.value.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = tabs.value[index + 1] || tabs.value[index - 1];
        if (nextTab) {
          activeName = nextTab.name;
        }
      }
    });
  }

  tabs.value = _tabs.filter((tab) => tab.name !== targetName);
  currentTabsValue.value = activeName;
};

let openMdFileEventBus: EventBus = new EventBus(EventBusType.OpenMdFile);
openMdFileEventBus.on((path) => {
  // 随机生成一个唯一的 name
  const name = Math.random().toString(36).substr(2, 8);
  // 判断打开的文件有没有文件名重名的
  // 重名则需要展示完整路径，否则展示文件名
  let file_name = path.split("/").pop();
  const duplicate = Object.values(tabs.value).filter((tabItem) => {
    return tabItem.title === file_name;
  });

  let title = file_name;

  // 判断二者的path是否相同，相同则不再打开
  if (duplicate.length > 0) {
    const isDuplicate = duplicate.some((item) => item.path === path);
    if (isDuplicate) {
      currentTabsValue.value = duplicate[0].name;
      return;
    } else {
      title = path; // 不同路径下的同名文件，需要展示完整路径
    }
  }

  tabs.value.push({ title, name, path });

  // 设置当前激活的tab
  currentTabsValue.value = name;
});

let vditorInstanceCreatedEventBus: EventBus = new EventBus(
  EventBusType.VditorInstanceCreated
);

// 监听编辑器实例创建事件
vditorInstanceCreatedEventBus.on((data) => {
  const { name, vditorInstance } = data;
  tabsWidgets[name] = vditorInstance;
});
</script>

<template>
  <div class="workspace">
    <el-tabs
      v-model="currentTabsValue"
      type="card"
      class="demo-tabs"
      closable
      @tab-remove="removeTab"
      v-if="tabs.length > 0"
    >
      <el-tab-pane
        v-for="item in tabs"
        :key="item.name"
        :label="item.title"
        :name="item.name"
        class="tab-pane"
      >
        <template #add-icon> hello </template>
        <MdEditor :editor="item.name" :path="item.path" />
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

.workspace {
  width: 100%;
  height: 100%;
}

.tab-pane {
  height: calc(100% - 40px);
  overflow: auto;
}

.empty-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
