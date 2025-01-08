<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { SlVueTreeNext } from "sl-vue-tree-next";
import "sl-vue-tree-next/sl-vue-tree-next-dark.css";

import { ref, onMounted, nextTick } from "vue";

import { ElSelect, ElOption } from "element-plus";

import EventBus from "@/eventBus";
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuItem,
} from "@imengyu/vue3-context-menu";

import fs from "@/utils/githubFs/fs";
import api from "@/utils/githubFs/api";

const loading = ref(false);

let current_clicked_node = null;

const dialogCreateFileVisible = ref(false); // 创建文件的对话框

const createFileValue = ref({
  fileName: "",
  createFolder: "",
  type: "file",
});

const menuVisible = ref(false);
const showItem = ref(true);
const optionsComponent = ref({
  x: 500,
  y: 200,
});

const selectTreeType = ref("remote");
const treeTypes = ref([
  { label: "混合显示文件树", value: "mixed" },
  { label: "本地缓存文件树(扁平)", value: "local" },
  { label: "远程Github文件树(只读)", value: "remote" },
]);

let fileTree = ref([]);

// 转换 GitHub API 返回的文件目录树为所需格式
const transformRemoteTree = (tree) => {
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

const transformLocalTree = (tree) => {
  const result = [];

  tree.forEach((item) => {
    result.push({
      title: item,
      isLeaf: true,
      isExpanded: false,
      data: {
        path: item,
      },
      children: [],
    });
  });
  return result;
};

const mixTree = (local, remote) => {
  const pathMap = {};

  remote.forEach((item) => {
    pathMap[item.data.path] = item;
    item.data.posititon = "remote";
  });

  local.forEach((item) => {
    if (pathMap[item.data.path]) {
      // 如果本地和远程同时有一个项目则按本地的算
      const remoteItem = pathMap[item.data.path];
      remoteItem.title = item.title;
      remoteItem.isLeaf = item.isLeaf;
      remoteItem.data = item.data;
      remoteItem.children = mixTree(remoteItem.children, item.children);
    } else {
      pathMap[item.data.path] = item;
      item.data.posititon = "local";
      remote.push(item);
    }
  });

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

  sortItems(remote);

  return remote;
};

// 更新目录树
const updateTree = async () => {
  loading.value = true;
  if (selectTreeType.value === "remote") {
    api.getRepoTree().then((res) => {
      let tree = transformRemoteTree(res.tree);
      fileTree.value = tree;
      loading.value = false;
    });
  } else if (selectTreeType.value === "local") {
    fs.list().then(async (res) => {
      let tree = transformLocalTree(res);
      fileTree.value = tree;
      loading.value = false;
    });
  } else {
    let remote = await api.getRepoTree();
    let remote_tree = transformRemoteTree(remote.tree);
    console.log("local", remote_tree);
    let local = await fs.list();
    let local_tree = transformLocalTree(local);
    console.log("local", local_tree);
    let mixed_tree = await mixTree(local_tree, remote_tree);
    console.log("mixed", mixed_tree);
    fileTree.value = mixed_tree;
    loading.value = false;
  }
};

onMounted(() => {
  updateTree();
});

// 节点选择事件处理函数
const nodeSelected = (selectedNodes) => {
  let node;
  if (selectedNodes.length < 0) {
    return;
  } else {
    node = selectedNodes[0];
  }

  if (node.isLeaf) {
    let path = node.data.path;
    openFile(path);
  }
};

const openFile = (path) => {
  // 获取后缀名
  let suffix = path.substring(path.lastIndexOf(".") + 1);
  if (suffix === "md") {
    EventBus.emit("openMdFile", path);
  } else {
    EventBus.emit("openFile", path);
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
  // 只在混合模式下允许创建，删除，重命名等操作
  if (selectTreeType.value !== "mixed") {
    return;
  }
  console.log("showContextMenu:", node);
  current_clicked_node = node;
  event.preventDefault();
  optionsComponent.value = {
    x: event.clientX,
    y: event.clientY,
  };
  menuVisible.value = true;
};

// 删除文件
const deleteFile = (e) => {
  // Todo
  if (current_clicked_node.data.posititon === "remote") {
    ElMessageBox.confirm("将立即执行git提交，确定删除远程文件吗？", "Warning", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        let message = "Delete : " + current_clicked_node.data.path;
        let files = [{ path: current_clicked_node.data.path, content: null }];
        loading.value = true;
        api.commitChanges(files, message).then((res) => {
          console.log("deleteFile", res);
          ElMessage({
            type: "success",
            message: "文件已删除! 若未更新请稍后刷新页面",
          });
          loading.value = false;
          updateTree();
        });
      })
      .catch(() => {
        ElMessage({
          type: "info",
          message: "已取消删除",
        });
      });
    return;
  } else {
    ElMessageBox.confirm(
      "确定删除吗？本地存储文件删除后不可恢复。",
      "Warning",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        fs.delete(current_clicked_node.data.path).then((res) => {
          console.log("deleteFile", res);
          ElMessage({
            type: "success",
            message: "文件已删除!",
          });
          updateTree();
        });
      })
      .catch(() => {
        ElMessage({
          type: "info",
          message: "已取消删除",
        });
      });
  }
};

const showCreateFileDialog = (e) => {
  let create_folder;

  if (current_clicked_node.data.type === "tree") {
    create_folder = current_clicked_node.data.path;
  } else {
    create_folder = current_clicked_node.data.path.substring(
      0,
      current_clicked_node.data.path.lastIndexOf("/")
    );
  }

  let target = e.target;

  // 向上遍历 DOM 树，直到找到具有 data-type 属性的父元素
  while (target && !target.dataset.type) {
    target = target.parentElement;
  }

  createFileValue.value = {
    fileName: "",
    fileFolder: create_folder ? create_folder : "",
    type: target.dataset.filetype,
  };

  menuVisible.value = false;
  nextTick(() => {
    dialogCreateFileVisible.value = true;
  });
};

const createFile = () => {
  console.log("createFile", createFileValue.value);
  let path =
    createFileValue.value.fileFolder + "/" + createFileValue.value.fileName;
  // 去除多余的斜杠
  path = path = path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
  // 校验非法字符
  if (path.match(/[<>:"|?*\x00-\x1F]/)) {
    ElMessage.error("文件路径不合法");
    return;
  }

  let type = createFileValue.value.type;
  if (type !== "file" && !path.endsWith(".md")) {
    path = path + ".md";
  }

  console.log("createFile", path);

  // 检查文件是否存在
  let node = fileTree.value.find((item) => item.data.path === path);
  if (node) {
    ElMessage.error("文件已存在");
    return;
  }

  let content = "";

  if (createFileValue.value.type !== "file") {
    let draft = "false";
    if (createFileValue.value.type === "draft") {
      draft = "true";
    }
    let fileNameWithExtension = path.substring(path.lastIndexOf("/") + 1);
    // 去掉文件后缀
    let fileName = fileNameWithExtension.substring(
      0,
      fileNameWithExtension.lastIndexOf(".")
    );
    console.log("fileName", fileName);
    const formattedDate = new Date()
      .toISOString()
      .replace(/\.\d{3}Z$/, "-08:00");
    content = `---\ntitle: ${fileName}\ndata: ${formattedDate}\ndraft: false\n---`;
  }

  fs.write(path, content).then((res) => {
    console.log("createFile", res);
    updateTree();
  });

  openFile(path);

  dialogCreateFileVisible.value = false;
};
</script>

<template>
  <div class="file-tree-box" v-loading="loading">
    <div class="title">文件管理器</div>
    <el-select
      class="select-tree-type"
      v-model="selectTreeType"
      collapse-tags
      placeholder="Select"
      popper-class="custom-header"
      :max-collapse-tags="2"
      @change="updateTree"
    >
      <el-option
        v-for="item in treeTypes"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <div class="file-tree-inner-box">
      <sl-vue-tree-next
        :modelValue="fileTree"
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
            <FontAwesomeIcon
              v-if="node.isExpanded"
              :icon="['fas', 'chevron-down']"
            />
            <FontAwesomeIcon
              v-if="!node.isExpanded"
              :icon="['fas', 'fa-chevron-right']"
            />
          </span>
        </template>

        <template #content="{ node }">
          <span class="item-icon">
            <font-awesome-icon v-if="node.isLeaf" :icon="['fa', 'fa-file']" />
            <font-awesome-icon v-else :icon="['fa', 'fa-folder']" />
          </span>
          {{ node.title }}
        </template>

        <template #sidebar="{ node }">
          <el-tooltip
            class="box-item"
            effect="dark"
            content="Github上的远程（未下载）"
            placement="right-start"
            v-if="node.data.posititon === 'remote'"
          >
            <font-awesome-icon :icon="['fab', 'github']" />
          </el-tooltip>
        </template>

        <!-- <template #draginfo="draginfo"> {{ selectedNodesTitle }} </template> -->
      </sl-vue-tree-next>
    </div>
    <context-menu v-model:show="menuVisible" :options="optionsComponent">
      <context-menu-group label="新建" icon="fas fa-plus">
        <context-menu-item
          label="新建文章"
          :clickClose="true"
          data-filetype="post"
          @click="showCreateFileDialog"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'square-pen']" />
          </template>
        </context-menu-item>
        <context-menu-item
          label="新建草稿"
          :clickClose="true"
          data-filetype="draft"
          @click="showCreateFileDialog"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'pen-ruler']" />
          </template>
        </context-menu-item>

        <ContextMenuSeparator />

        <context-menu-item
          label="文件"
          :clickClose="true"
          data-filetype="file"
          @click="showCreateFileDialog"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'file']" />
          </template>
        </context-menu-item>
      </context-menu-group>

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
          <font-awesome-icon
            :icon="['fas', 'trash']"
            style="color: var(--el-color-danger)"
          />
        </template>
      </context-menu-item>
    </context-menu>
  </div>
  <el-dialog v-model="dialogCreateFileVisible" title="创建文件" width="500">
    <el-form>
      <el-form-item label="文件名称">
        <el-input v-model="createFileValue.fileName" autocomplete="off">
          <template #prepend>{{
            "根目录/" + createFileValue.fileFolder
          }}</template>
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogCreateFileVisible = false">取消</el-button>
        <el-button type="primary" @click="createFile"> 创建 </el-button>
      </div>
    </template>
  </el-dialog>
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

.select-tree-type {
  width: 100%;
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

.sl-vue-tree-next.sl-vue-tree-next-root {
  border: none;
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
