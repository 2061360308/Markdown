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
    <context-menu v-model:show="menuVisible" :options="optionsComponent">
      <context-menu-item
        label="新建文章"
        :clickClose="false"
        @click="showItem = !showItem"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'square-pen']" />
        </template>
      </context-menu-item>
      <context-menu-item
        label="新建草稿"
        :clickClose="false"
        @click="showItem = !showItem"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'pen-ruler']" />
        </template>
      </context-menu-item>

      <context-menu-sperator />

      <context-menu-group label="新建">
        <context-menu-item
          label="文件夹"
          :clickClose="false"
          @click="showItem = !showItem"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'folder']" />
          </template>
        </context-menu-item>
        <context-menu-item
          label="文件"
          :clickClose="false"
          @click="showItem = !showItem"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'file']" />
          </template>
        </context-menu-item>
      </context-menu-group>

      <context-menu-sperator />

      <context-menu-item
        label="重命名"
        :clickClose="false"
        @click="showItem = !showItem"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'i-cursor']" />
        </template>
      </context-menu-item>
      <context-menu-item
        label="复制"
        :clickClose="false"
        @click="showItem = !showItem"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'copy']" /> </template
      ></context-menu-item>
      <context-menu-item
        label="删除"
        :clickClose="false"
        @click="showItem = !showItem"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'trash']" />
        </template>
      </context-menu-item>
    </context-menu>
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
  faSquarePen,
  faPenRuler,
  faICursor,
  faTrash,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { defineProps, nextTick } from "vue";
import { SlVueTreeNext } from "sl-vue-tree-next";
import "sl-vue-tree-next/sl-vue-tree-next-dark.css";

import { ref, onMounted } from "vue";
import { getFilesTree, openFile } from "@/utils/fileOperation";
import EventBus from "@/eventBus";
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuItem,
} from "@imengyu/vue3-context-menu";

const loading = ref(false);

const contextmenu = ref(null);

const menuVisible = ref(false);
const showItem = ref(true);
const optionsComponent = ref({
  x: 500,
  y: 200,
});

// 添加你需要的图标
library.add(
  faChevronDown,
  faChevronRight,
  faFolder,
  faFolderOpen,
  faFile,
  faSquarePen,
  faPenRuler,
  faICursor,
  faTrash,
  faCopy
);

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
const showContextMenu = (node, event) => {
  event.preventDefault();
  // menuVisible.value = true;
  // contextmenu.value.style.left = event.clientX + "px";
  // contextmenu.value.style.top = event.clientY + "px";
  // nextTick(() => {
  //   contextmenu.value.focus(); // 使菜单获得焦点
  // });
  optionsComponent.value = {
    x: event.clientX,
    y: event.clientY,
  };
  menuVisible.value = true;
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

.contextmenu__item {
  display: block;
  line-height: 34px;
  text-align: center;
}
.contextmenu__item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.menu {
  position: absolute;
  background-color: #fff;
  width: 100px;
  /*height: 106px;*/
  font-size: 12px;
  color: #444040;
  border-radius: 4px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
  white-space: nowrap;
  z-index: 1000;
}
.contextmenu__item:hover {
  cursor: pointer;
  background: #66b1ff;
  border-color: #66b1ff;
  color: #fff;
}
</style>
