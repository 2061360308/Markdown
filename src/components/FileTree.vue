<template>
  <div class="file-tree-box" v-loading="loading">
    <div class="title">文件管理器</div>
    <div class="file-tree-inner-box">
      <sl-vue-tree-next
        :modelValue="fileNodes"
        @update:modelValue="updateFileNodes"
        ref="slVueTree"
        :allow-multiselect="false"
        :allow-drag="false"
        @select="nodeSelected"
        @drop="nodeDropped"
        @toggle="nodeToggled"
        @nodecontextmenu="showContextMenu"
        class="sl-vue-tree-next"
      >
        <template #title="{ node }">
          <span class="item-icon">
            <i class="fa-solid fa-file" v-if="node.isLeaf"></i>
            <i class="fa-solid fa-folder" v-if="!node.isLeaf"></i>
          </span>
          {{ node.title }}
        </template>

        <template #toggle="{ node }">
          <span v-if="!node.isLeaf">
            <font-awesome-icon
              :icon="['fas', 'chevron-down']"
              v-if="node.isExpanded"
            />
            <font-awesome-icon
              :icon="['fas', 'chevron-right']"
              v-if="!node.isExpanded"
            />
          </span>
        </template>

        <!-- <template #draginfo="draginfo"> {{ selectedNodesTitle }} </template> -->
      </sl-vue-tree-next>
    </div>
  </div>
</template>

<script setup>
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faFolder,
  faFolderOpen,
  faFile,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { defineProps } from "vue";
import { SlVueTreeNext } from "sl-vue-tree-next";
import "sl-vue-tree-next/sl-vue-tree-next-dark.css";

import { ref, onMounted } from "vue";
import { getFilesTree, openFile } from "@/utils/fileOperation";
import EventBus from "@/eventBus";

const loading = ref(false);

// 添加你需要的图标
library.add(faChevronDown, faChevronRight, faFolder, faFolderOpen, faFile);

let fileNodes = ref([]);

onMounted(() => {
  loading.value = true;
  getFilesTree().then((tree) => {
    fileNodes.value = tree;
    loading.value = false;
  });
});

// 更新 fileNodes 的方法
const updateFileNodes = (newNodes) => {
  //   props.fileNodes = newNodes;
};

// 节点选择事件处理函数
const nodeSelected = (selectedNodes) => {
  let node;
  if (selectedNodes.length < 0) {
    return;
  } else {
    node = selectedNodes[0];
  }

  if (node.isLeaf) {
    console.log("Node selected:", node);
    let path = node.data.path;
    // 获取后缀名
    let suffix = path.substring(path.lastIndexOf(".") + 1);
    if (suffix === "md") {
      EventBus.emit("openMdFile", node.data.path);
    } else {
      EventBus.emit("openFile", node.data.path);
    }
  }
};

// 节点拖拽事件处理函数
const nodeDropped = (event) => {
  console.log("Node dropped:", event);
};

// 节点展开/折叠事件处理函数
const nodeToggled = (node) => {
  console.log("Node toggled:", node);
};

// 显示右键菜单
const showContextMenu = (event, node) => {
  console.log("Show context menu:", event, node);
};
</script>

<style>
.file-tree-box {
  height: 100%;
}

.title {
  font-size: 16px;
  font-weight: bold;
  padding: 10px;
  white-space: nowrap; /* 确保内容不会换行 */
  height: 40px;
}

.file-tree-inner-box {
  height: calc(100% - 40px);
  overflow: auto;
  white-space: nowrap; /* 确保内容不会换行 */
}

.sl-vue-tree-next {
  min-height: 100%;
  min-width: 100%;
  white-space: nowrap; /* 确保内容不会换行 */
}

.sl-vue-tree-next.sl-vue-tree-next-root {
  border: 1px solid rgb(9, 22, 29);
  background-color: var(--el-color-primary-rgb);
  color: var(--el-color-secondary-text);
  border-radius: 3px;
}

.sl-vue-tree-next-selected > .sl-vue-tree-next-node-item {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
}

.sl-vue-tree-next-node-item:hover,
.sl-vue-tree-next-node-item.sl-vue-tree-next-cursor-hover {
  background-color: var(--el-color-primary-light-7);
  color: var(--el-color-secondary-text);
}
</style>
