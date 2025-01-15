<script lang="ts" setup>
import { useTabsStore, useEventStore } from "@/stores";
import { ref, onMounted } from "vue";
import { outlineRender, TreeNode } from "@/utils/outlineRender";
import { watch } from "vue";
import { ElMessage } from "element-plus";

const tabsStore = useTabsStore();
const eventStore = useEventStore();

const outlineBox = ref<HTMLElement | null>(null);

const defaultProps = {
  children: "children",
  label: "label",
};

const outLineTree = ref<TreeNode[]>([]);
const containerRef = ref<HTMLElement | null>(null);

const noMarkdown = ref(false);

const updateOutline = () => {
  let current_tab = tabsStore.tabs.filter(
    (tab) => tab.id === tabsStore.activeTabId
  )[0];

  if (!current_tab || current_tab.type !== tabsStore.TabType.MdFile) {
    noMarkdown.value = true;
    return;
  } else {
    noMarkdown.value = false;
  }

  let mode = tabsStore.vditorInstance[tabsStore.activeTabId].getCurrentMode();

  let sourceClass = ".vditor-ir";

  if (mode === "wysiwyg") {
    sourceClass = ".vditor-wysiwyg";
  } else if (mode === "ir") {
    sourceClass = ".vditor-ir";
  } else {
    sourceClass = ".vditor-preview";
  }

  let editor_id = current_tab.id;
  containerRef.value = (
    document.getElementById(editor_id) as HTMLElement
  ).querySelector(sourceClass) as HTMLElement;

  let outline = outlineRender(containerRef.value);
  outLineTree.value = outline;
};

watch(
  () => eventStore.fileChanged,
  () => {
    updateOutline();
  }
);

const refreshClick = () => {
  updateOutline();
  ElMessage.success("大纲已刷新");
};

onMounted(() => {
  updateOutline();
});

let observer: IntersectionObserver;
</script>

<template>
  <div>
    <div class="title-bar">
      <div class="title">当前大纲</div>
      <div class="actions">
        <el-button circle @click="refreshClick" type="">
          <template #icon>
            <font-awesome-icon :icon="['fas', 'arrows-rotate']" size="lg" />
          </template>
        </el-button>
      </div>
    </div>
    <div ref="outlineBox" class="outline-box" v-if="!noMarkdown">
      <el-tree
        :data="outLineTree"
        :props="defaultProps"
        :default-expand-all="true"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <a :href="`#${data.id}`">
            <span :class="data.level">
              {{ node.label.replace(/^#+\s*/, "").trim() }}
            </span>
          </a>
        </template>
      </el-tree>
    </div>
    <el-empty description="没有打开的文档" v-else />
  </div>
</template>

<style scoped>
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

a {
  text-decoration: none;
  color: var(--el-text-color-primary);
}

.outlineBox {
  margin-top: 10px;
  padding: 15px;
  height: calc(100% - 50px);
  overflow: auto;
}

.outline-box .H1,
.outline-box .H2,
.outline-box .H3,
.outline-box .H4,
.outline-box .H5,
.outline-box .H6 {
  font-weight: bold;
  margin-left: 10px;
}

.outline-box .H1::after,
.outline-box .H2::after,
.outline-box .H3::after,
.outline-box .H4::after,
.outline-box .H5::after,
.outline-box .H6::after {
  float: right;
  padding-left: 10px;
  font-weight: normal;
  color: var(--el-color-primary-light-3);
  box-sizing: border-box;
  margin: 0;
}

.outline-box .H1 {
  font-size: 24px;
}

.outline-box .H1::after {
  content: "H1";
  font-size: 18px;
}

.outline-box .H2 {
  font-size: 20px;
}

.outline-box .H2::after {
  content: "H2";
  font-size: 16px;
}

.outline-box .H3 {
  font-size: 16px;
}

.outline-box .H3::after {
  content: "H3";
  font-size: 14px;
}

.outline-box .H4 {
  font-size: 12px;
}

.outline-box .H4::after {
  content: "H4";
  font-size: 12px;
}

.outline-box .H5 {
  font-size: 10px;
}

outline-box .H5::after {
  content: "H5";
  font-size: 10px;
}

.outline-box .H6 {
  font-size: 8px;
}

outline-box .H6::after {
  content: "H6";
  font-size: 8px;
}
</style>
