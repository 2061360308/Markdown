<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { SlVueTreeNext } from "sl-vue-tree-next";
import "sl-vue-tree-next/sl-vue-tree-next-dark.css";
import { ref, onMounted, nextTick } from "vue";
import {
  ElSelect,
  ElOption,
  ElMessage,
  ElMessageBox,
} from "element-plus";

import { EventBusType, EventBus } from "@/eventBus";
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuItem,
} from "@imengyu/vue3-context-menu";

import fs from "@/utils/fs";
import api from "@/utils/api";

import { useSettingsStore, useTabsStore, useGlobalStore } from "@/stores";
import { computed } from "vue";

const tabsStore = useTabsStore();
const settingsStore = useSettingsStore();
const globalStore = useGlobalStore();

const repoName = computed(() => settingsStore.settings["基本配置"].repoName);

const loading = ref(false);

let current_clicked_node: Record<string, any> = {};

const dialogCreateFileVisible = ref(false); // 创建文件的对话框

const createFileValue = ref({
  fileName: "",
  post: false, // 是否是文章
  draft: false, // 是否是草稿文章
  fileFolder: "",
});

const menuVisible = ref(false);
const showItem = ref(true);
const optionsComponent = ref({
  x: 500,
  y: 200,
});

const selectTreeType = ref("mixed"); // 当前选择展示的文件树类型

// 文件树类型
const treeTypes = ref([
  { label: "混合显示文件树", value: "mixed" },
  { label: "本地缓存文件树(扁平)", value: "local" },
  { label: "远程Github文件树(只读)", value: "remote" },
]);

let fileTree = ref<any[]>([]); // 文件树

interface treeItemObject {
  title: string;
  isLeaf: boolean;
  isExpanded: boolean;
  data: {
    path: string;
    position?: "remote" | "local";
  };
  children?: treeItemObject[];
}

// 格式化远程文件树返回内容
const formatRemteTree = (
  tree: Array<{
    mode: string;
    path: string;
    sha: string;
    type: string;
    url: string;
  }>
): Array<treeItemObject> => {
  let result: Array<treeItemObject> = [];

  tree.forEach((item) => {
    let newItem: treeItemObject = {
      title: item.path.substring(item.path.lastIndexOf("/") + 1),
      isLeaf: item.type === "blob",
      isExpanded: false,
      data: {
        path: item.path,
      },
    };

    if (newItem.isLeaf) {
      newItem.data.position = "remote";
    }
    result.push(newItem);
  });

  return result;
};

const formatLocalTree = (tree: Array<string>): Array<treeItemObject> => {
  let result: Array<treeItemObject> = [];

  tree.forEach((item) => {
    let parts = item.split("/");
    for (let i = 0; i < parts.length; i++) {
      let path = parts.slice(0, i + 1).join("/");
      let node = result.find((node) => node.data.path === path);
      if (!node) {
        let newItem: treeItemObject = {
          title: parts[i],
          isLeaf: i === parts.length - 1,
          isExpanded: false,
          data: {
            path: path,
          },
        };
        if (newItem.isLeaf) {
          newItem.data.position = "local";
        }
        result.push(newItem);
      }
    }
  });

  return result;
};

const mixedTree = (
  remote: Array<treeItemObject>,
  local: Array<treeItemObject>
): Array<treeItemObject> => {
  let result: Array<treeItemObject> = [];
  remote.forEach((item) => {
    let node = local.find((node) => node.data.path === item.data.path);
    if (!node) {
      result.push(item);
    }
  });
  local.forEach((item) => {
    result.push(item);
  });
  return result;
};

const transformTree = (tree: Array<treeItemObject>) => {
  const pathMap: { [key: string]: treeItemObject } = {};

  tree.forEach((item) => {
    pathMap[item.data.path] = { ...item, children: [] };
  });

  const result: Array<treeItemObject> = [];

  tree.forEach((item) => {
    const parentPath = item.data.path.substring(
      0,
      item.data.path.lastIndexOf("/")
    );
    if (parentPath && pathMap[parentPath]) {
      if (!pathMap[parentPath].children) {
        pathMap[parentPath].children = [];
      }
      pathMap[parentPath].children.push(pathMap[item.data.path]);
    } else {
      result.push(pathMap[item.data.path]);
    }
  });

  // 排序函数，将文件夹放在前面，并按字母顺序排序
  const sortItems = (items: any[]) => {
    items.sort(
      (a: { isLeaf: any; title: string }, b: { isLeaf: any; title: any }) => {
        if (a.isLeaf === b.isLeaf) {
          return a.title.localeCompare(b.title);
        }
        return a.isLeaf ? 1 : -1;
      }
    );

    items.forEach((item: { isLeaf: any; children: any[] }) => {
      if (
        !item.isLeaf &&
        Array.isArray(item.children) &&
        item.children.length > 0
      ) {
        sortItems(item.children);
      }
    });
  };

  sortItems(result);

  return result;
};


// 更新目录树
const updateTree = async () => {
  loading.value = true;
  if (selectTreeType.value === "remote") {
    if (!api.ready) {
      loading.value = false;
      selectTreeType.value = "mixed";
      ElMessage({
        type: "warning",
        message: "请先登录",
      });
      return;
    }
    api.getRepoTree().then((res) => {
      let remoteTree = formatRemteTree(
        res.tree.map((item) => ({
          mode: item.mode || "",
          path: item.path || "",
          sha: item.sha || "",
          type: item.type || "",
          url: item.url || "",
        }))
      );
      fileTree.value = transformTree(remoteTree);
      loading.value = false;
    });
  } else if (selectTreeType.value === "local") {
    fs.list(repoName.value).then(async (res) => {
      let loaclTree = formatLocalTree(res);
      fileTree.value = transformTree(loaclTree);
      loading.value = false;
    });
  } else {
    let remoteTree: Array<treeItemObject> = [];
    let loaclTree: Array<treeItemObject> = [];
    if (api.ready) {
      // 没有登录时不请求远程文件树
      let remote = await api.getRepoTree();
      remoteTree = formatRemteTree(
        remote.tree.map((item) => ({
          mode: item.mode || "",
          path: item.path || "",
          sha: item.sha || "",
          type: item.type || "",
          url: item.url || "",
        }))
      );
    }

    let local = await fs.list(repoName.value);
    loaclTree = formatLocalTree(local);

    const mixed: Array<treeItemObject> = mixedTree(remoteTree, loaclTree);
    fileTree.value = transformTree(mixed);

    loading.value = false;
    ElMessage({
      type: "success",
      message: "文件树已更新",
    });
  }
};

onMounted(() => {
  updateTree();
});

// 节点选择事件处理函数
const nodeSelected = (selectedNodes: string | any[]) => {
  let node;
  if (selectedNodes.length < 0) {
    return;
  } else {
    node = selectedNodes[0];
  }

  if (node.isLeaf) {
    let path = node.data.path;
    if (selectTreeType.value === "remote") {
      console.log("remote只读");
    } else if (selectTreeType.value === "local") {
      tabsStore.openFile(path);
    } else {
      if (node.data.position === "remote") {
        loading.value = true;
        // 从远程仓库下载文件
        api.getFileContent(path).then((res) => {
          console.log("getFileContent", res);
          let content = res.decodedContent;
          fs.write(path, content, repoName.value).then((res) => {
            tabsStore.openFile(path); // 打开文件
            loading.value = false;
            updateTree();
          });
        });
      } else {
        // 本地文件，打开
        tabsStore.openFile(path);
      }
    }
  }
};

const openFile = (path: string) => {
  // 获取后缀名
  let suffix = path.substring(path.lastIndexOf(".") + 1);
  let eventBus: EventBus;
  if (suffix === "md") {
    eventBus = new EventBus(EventBusType.OpenMdFile);
  } else {
    eventBus = new EventBus(EventBusType.OpenMdFile);
  }
  eventBus.emit(path);
};

// 节点拖拽事件处理函数
const nodeDropped = (event: any) => {
  console.log("Node dropped:", event);
};

// 节点展开/折叠事件处理函数
const nodeToggled = (node: any) => {
  console.log("Node toggled:", node);
};

// 显示右键菜单
const showContextMenu = (
  node: any,
  event: { preventDefault: () => void; clientX: any; clientY: any }
) => {
  // 只在混合模式下允许创建，删除，重命名等操作
  if (selectTreeType.value !== "mixed") {
    return;
  }

  current_clicked_node = node;
  event.preventDefault();
  optionsComponent.value = {
    x: event.clientX,
    y: event.clientY,
  };
  menuVisible.value = true;
};

const titleBarCreateClick = () => {
  current_clicked_node = {};
  showCreateFileDialog(false, false);
};

// 删除文件
const deleteFile = (e: any) => {
  // Todo
  if (
    current_clicked_node &&
    current_clicked_node?.data?.posititon === "remote"
  ) {
    ElMessageBox.confirm("将立即执行git提交，确定删除远程文件吗？", "Warning", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        let message = "Delete : " + (current_clicked_node?.data?.path ?? "");
        let files = [
          { path: current_clicked_node?.data?.path ?? "", content: null },
        ];
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
      .catch((e) => {
        console.log("deleteFile", e);
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
        fs.delete(current_clicked_node.data.path, repoName.value).then((res) => {
          console.log("deleteFile", res);
          ElMessage({
            type: "success",
            message: "文件已删除!",
          });
          updateTree();
        });
      })
      .catch((e) => {
        console.log("deleteFile", e);
        ElMessage({
          type: "info",
          message: "已取消删除",
        });
      });
  }
};

const showCreateFileDialog = (
  post: boolean = false,
  draft: boolean = false
) => {
  let create_folder;

  if (current_clicked_node === null) {
    create_folder = "";
  } else if (current_clicked_node.data.type === "tree") {
    create_folder = current_clicked_node.data.path;
  } else {
    create_folder = current_clicked_node.data.path.substring(
      0,
      current_clicked_node.data.path.lastIndexOf("/")
    );
  }

  // let target = e.target;

  // 向上遍历 DOM 树，直到找到具有 data-filetype 属性的父元素
  // while (target && !target.dataset.filetype) {
  //   target = target.parentElement;
  // }

  createFileValue.value = {
    fileName: "",
    fileFolder: create_folder ? create_folder : "",
    draft: draft,
    post: post,
  };

  menuVisible.value = false;
  nextTick(() => {
    dialogCreateFileVisible.value = true;
  });
};

const createFile = () => {
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

  console.log("createFile", path);

  // 如果是文章，且没有后缀名，则添加后缀名
  if (createFileValue.value.post && !path.endsWith(".md")) {
    path = path + ".md";
  }

  // 检查文件是否存在
  let node = fileTree.value.find((item) => item.data.path === path);
  if (node) {
    ElMessage.error("文件已存在");
    return;
  }

  let content = "";

  // 如果是文章，添加 front matter
  if (createFileValue.value.post) {
    // 获取文件名
    let fileNameWithExtension = path.substring(path.lastIndexOf("/") + 1);
    // 去掉文件后缀
    let fileName = fileNameWithExtension.substring(
      0,
      fileNameWithExtension.lastIndexOf(".")
    );
    content = `---\n${settingsStore.getfrontMatter(
      fileName,
      createFileValue.value.draft
    )}\n---`;
  }

  fs.write(path, content, repoName.value).then((res) => {
    console.log("createFile", res);
    updateTree();
  });

  openFile(path);

  dialogCreateFileVisible.value = false;
};
</script>

<template>
  <div class="file-tree-box" v-loading="loading">
    <div class="title-bar">
      <div class="title">资源管理器</div>
      <div class="actions">
        <el-button circle @click="titleBarCreateClick">
          <template #icon>
            <font-awesome-icon :icon="['fas', 'file']" size="lg" />
          </template>
        </el-button>
        <el-button circle @click="updateTree">
          <template #icon>
            <font-awesome-icon :icon="['fas', 'arrows-rotate']" size="lg" />
          </template>
        </el-button>
      </div>
    </div>
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
    <div class="no-login-tip" v-if="!api.ready">
      登录后可使用完整功能
      <el-button type="primary" size="small" round @click="globalStore.goLogin"
        >登录</el-button
      >
    </div>
    <div
      class="file-tree-inner-box"
      :style="{
        height: api.ready ? 'calc(100% - 70px)' : 'calc(100% - 140px)',
      }"
    >
      <sl-vue-tree-next
        :modelValue="fileTree"
        ref="slVueTree"
        :allow-multiselect="false"
        :allow-drag="false"
        @select="nodeSelected"
        @drop="nodeDropped"
        @toggle="nodeToggled"
        @nodecontextmenu="showContextMenu"
        class="sl-vue-tree-next"
        v-if="fileTree.length > 0"
      >
        <template #title="{ node }">
          <span class="item-icon">
            <FontAwesomeIcon
              v-if="node.isLeaf && node.data.path.endsWith('.md')"
              :icon="['fas', 'square-pen']"
              style="color: var(--el-color-primary)"
            />
            <FontAwesomeIcon v-else-if="node.isLeaf" :icon="['fas', 'file']" />
            <FontAwesomeIcon v-else :icon="['fas', 'folder']" />
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

        <template #sidebar="{ node }">
          <el-tooltip
            class="box-item"
            effect="dark"
            content="Github上的远程（未下载）"
            placement="right-start"
            v-if="node.data.position === 'remote'"
          >
            <font-awesome-icon :icon="['fab', 'github']" />
          </el-tooltip>
        </template>
      </sl-vue-tree-next>
      <el-empty v-else description="点击右上角创建文件" />
    </div>
    <context-menu v-model:show="menuVisible" :options="optionsComponent">
      <context-menu-group label="新建" icon="fas fa-plus">
        <context-menu-item
          label="新建文章"
          :clickClose="true"
          data-filetype="post"
          @click="showCreateFileDialog(true, false)"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'square-pen']" />
          </template>
        </context-menu-item>
        <context-menu-item
          label="新建草稿"
          :clickClose="true"
          data-filetype="draft"
          @click="showCreateFileDialog(true, true)"
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
          @click="showCreateFileDialog(false, false)"
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
        v-if="current_clicked_node.isLeaf === true"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'i-cursor']" />
        </template>
      </context-menu-item>
      <context-menu-item
        label="复制"
        :clickClose="false"
        @click="showItem = !showItem"
        v-if="current_clicked_node.isLeaf === true"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'copy']" /> </template
      ></context-menu-item>
      <context-menu-item
        label="删除"
        :clickClose="false"
        @click="deleteFile"
        v-if="current_clicked_node.isLeaf === true"
      >
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

<style scoped>
.file-tree-box {
  height: 100%;
}

.title-bar {
  padding: 10px;
  height: 40px;
  white-space: nowrap; /* 确保内容不会换行 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 5px;
}

.title-bar .title {
  font-size: 16px;
  font-weight: bold;
}

.title-bar .actions {
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: end;
  align-items: center;
}

.select-tree-type {
  width: 100%;
}

.no-login-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px;
  padding: 10px 20px;
  background-color: var(--el-color-primary-light-3);
  color: var(--el-color-white);
  border-radius: 5px;
  white-space: nowrap;
}

.no-login-tip .el-button {
  margin-left: 10px;
}

.file-tree-inner-box {
  overflow: auto;
  white-space: nowrap;
}
</style>

<style>
.sl-vue-tree-next {
  min-height: 100%;
  min-width: 100%;
  white-space: nowrap;
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

/* .sl-vue-tree-next-selected .item-icon svg {
  color: var(--el-color-white);
} */

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
