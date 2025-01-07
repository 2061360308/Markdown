<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { SlVueTreeNext } from "sl-vue-tree-next";
import "sl-vue-tree-next/sl-vue-tree-next-dark.css";

import { ref, onMounted } from "vue";
import EventBus from "@/eventBus";
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuItem,
} from "@imengyu/vue3-context-menu";

import fs from "@/utils/githubFs/fs";

const loading = ref(false);

const contextmenu = ref(null);

let current_clicked_node = null;

const menuVisible = ref(false);
const showItem = ref(true);
const optionsComponent = ref({
  x: 500,
  y: 200,
});

let fileNodes = ref([]);

// 转换 GitHub API 返回的文件目录树为所需格式
const transformTree = (tree) => {
  const result = [];
  const pathMap = {};

  tree.forEach((item) => {
    const parts = item.path.split("/");
    let currentLevel = result;

    parts.forEach((part, index) => {
      const currentPath = parts.slice(0, index + 1).join("/");
      const existingPath = pathMap[currentPath];

      if (existingPath) {
        currentLevel = existingPath.children;
      } else {
        const newItem = {
          title: part,
          isLeaf: item.type === "blob",
          isExpanded: false,
          data: {
            path: item.path,
            mode: item.mode,
            type: item.type,
            size: item.size,
            sha: item.sha,
          },
          children: [],
        };

        currentLevel.push(newItem);
        pathMap[currentPath] = newItem;

        if (item.type === "tree") {
          currentLevel = newItem.children;
        }
      }
    });
  });

  // 排序函数，将文件夹放在前面，并按字母顺序排序
  const sortItems = (items) => {
    items.sort((a, b) => {
      if (a.isLeaf === b.isLeaf) {
        return a.title.localeCompare(b.title);
      }
      return a.isLeaf ? 1 : -1;
    });

    items.forEach((item) => {
      if (!item.isLeaf && item.children.length > 0) {
        sortItems(item.children);
      }
    });
  };

  sortItems(result);

  return result;
};

// 更新目录树
const updateTree = () => {
  loading.value = true;
  fs.list().then(async (res) => {
    // 拿到的数据要将本地标记为删除的文件删除
    let deletedFiles = await fs.getDeletedFiles();
    console.log("deletedFiles:", deletedFiles);
    res = res.filter((item) => deletedFiles.indexOf(item.path) === -1);
    let tree = transformTree(res);
    console.log("tree:", tree);
    fileNodes.value = tree;
    loading.value = false;
  });
};

EventBus.on("treeUpdate", updateTree);

onMounted(() => {
  updateTree();
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
  console.log("showContextMenu:", node);
  current_clicked_node = node;
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

// 删除文件
const deleteFile = (e) => {
  console.log("删除文件", e);
  let path = current_clicked_node.data.path;
  console.log("path:", path);
  fs.remove(path).then(() => {
    console.log("删除文件成功");
    menuVisible.value = false;
  });
  updateTree();
};
</script>

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

      <ContextMenuSeparator />

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

      <ContextMenuSeparator />

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
      <context-menu-item label="删除" :clickClose="false" @click="deleteFile">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'trash']" />
        </template>
      </context-menu-item>
    </context-menu>
  </div>
</template>

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
