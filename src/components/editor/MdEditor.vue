<script setup lang="ts">
import Vditor from "vditor";
import "vditor/dist/index.css";
import {
  ref,
  defineProps,
  defineExpose,
  watch,
  onBeforeUnmount,
  nextTick,
  Ref,
  computed,
} from "vue";

import { EventBusType, EventBus } from "@/eventBus";
import { ElMessage } from "element-plus";
import FrontMatterEditor from "./FrontMatterEditor.vue";

import fs from "@/utils/fs";
import imagehosting from "@/utils/imagehosting";
import { convertImagesToMarkdownBase64 } from "@/utils/imagehosting";
import { useSettingsStore, useEventStore, useTabsStore } from "@/stores";
import { onMounted } from "vue";

const settingsStore = useSettingsStore();
const tabsStore = useTabsStore();
const eventStore = useEventStore();

// 文章标题
const fileName = ref("");

// 如果是native模式，文件句柄
const fileHandle: Ref<FileSystemFileHandle | null> = ref(null);

const loading = ref(false);

const frontMatterString: Ref<string> = ref(""); // frontMatter 解析出来的对象

const props = defineProps({
  // 编辑器名称/id
  editor: {
    type: String,
    required: true,
  },
  // 文件路径
  path: {
    type: String,
    required: true,
  },
  // 仓库名称
  repo: {
    type: String,
    required: true,
  },
  // 是否用户本机文件
  native: {
    type: Boolean,
    default: false,
  },
});

const repoName = computed(() => props.repo);

let vditorInstance: Vditor | null = null;

defineExpose({
  vditorInstance,
});

// 最大编辑区域宽度(sv模式不生效)
const MaxEditRegionWidth = settingsStore.settings["编辑器配置"].editorMaxWidth;

const isAllSaved = ref(true); // 是否全部保存

const totalWordsNum = ref(0);

const currentMode = ref(settingsStore.settings["编辑器配置"].editorDefaultMode);

let modeInerval: any;

const createVditorInstance = () => {
  /**
   * 创建 Vditor 实例
   */

  // 等待下一个 tick 确保组件已渲染
  nextTick(() => {
    vditorInstance = new Vditor(props.editor, {
      value:
        "# Hello Vditor!\n\n这是编辑器预设内容，如果你看到这段文字代表内容没有被正确显示！",
      mode: currentMode.value,
      height: "100%",
      typewriterMode: settingsStore.settings["编辑器配置"].editorTypewriterMode,
      input: inputHandler,
      cache: {
        enable: true,
        id: props.path,
      },
      toolbarConfig: {
        pin: true,
      },
      toolbar: [
        "emoji",
        "headings",
        "bold",
        "italic",
        "strike",
        "link",
        "|",
        "list",
        "ordered-list",
        "check",
        "outdent",
        "indent",
        "|",
        "quote",
        "line",
        "code",
        "inline-code",
        "insert-before",
        "insert-after",
        "|",
        "upload",
        "record",
        "table",
        "|",
        "undo",
        "redo",
        "|",
        {
          name: "save",
          tipPosition: "ne",
          tip: "保存到本地~",
          className: "right",
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>',
          click: saveFile,
        },
        "fullscreen",
        "edit-mode",
        {
          name: "more",
          toolbar: [
            "both",
            "code-theme",
            "content-theme",
            "export",
            "outline",
            "preview",
            "devtools",
            "info",
            "help",
          ],
        },
      ],
      preview: {
        markdown: {
          autoSpace: settingsStore.settings["编辑器配置"].editorAutoSpace,
          gfmAutoLink: settingsStore.settings["编辑器配置"].editorGfmAutoLink,
        },
      },
      outline: {
        enable: true,
        position: "left",
      },
      counter: {
        enable: true,
        after: (length: number) => {
          totalWordsNum.value = length;
        },
      },
      upload: {
        accept: ".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg", // 允许上传的文件类型
        handler: uploadImage,
      },
      after: () => {
        // 确保 vditorInstance 完全初始化后再进行操作
        fileName.value = props.path.split("/").pop() || ""; // 设置文件名

        // console.log(vditorInstance);

        // 读取文件内容
        openFile(props.path);

        if (vditorInstance) {
          (vditorInstance as any).getContent = getContent; // 获取编辑器内容
          (vditorInstance as any).isAllSaved = isAllSaved; // 保存文件
        }

        tabsStore.vditorInstance[props.editor] = vditorInstance;
      },
    });
  });
};

// 等待编辑器 id 准备好后再创建 Vditor 实例
watch(
  () => props.editor,
  (newVal, oldVal) => {
    createVditorInstance();
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  modeInerval = setInterval(() => {
    if (vditorInstance) {
      currentMode.value = vditorInstance.vditor.currentMode;
    }
  }, 1000);
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  /**
   * 组件销毁时操作
   * 销毁 Vditor 实例
   * 清除其在缓存中的数据（Storage）
   */
  if (vditorInstance) {
    vditorInstance.clearCache(); // 清除缓存
    vditorInstance.destroy(); // 销毁实例
    vditorInstance = null;
  }

  clearInterval(modeInerval);
  window.removeEventListener("keydown", handleKeyDown);
});

const splitFrontMatter = (content: string): Record<string, string> => {
  const yalmPattern = /^---[\s\S]*?---/;
  const yamlMatch = content.match(yalmPattern);
  const yamlContent = yamlMatch ? yamlMatch[0] : "";
  const cleanedContent = content.replace(yamlContent, "");

  return {
    yamlContent,
    content: cleanedContent,
  };
};

const openFile = async (path: string) => {
  /**
   * 读取文件内容并设置到编辑器中
   * 会将 frontMatter 的内容分离出来，并设置到 frontMatter 中
   * 由 createVditorInstance 创建完Vditor实例后调用
   *  */

  let content = "";

  if (props.native) {
    // 加载句柄
    fileHandle.value = await tabsStore.tabs.find(
      (item) => item.id === props.editor
    )?.data.fileHandle;

    if (!fileHandle.value) {
      return;
    }

    // 读取文件内容
    const file = await fileHandle.value.getFile();
    content = await file.text();
  } else {
    content = await fs.get(path, repoName.value);
  }
  // 分离 frontMatter 和 content
  let result = splitFrontMatter(content);

  frontMatterString.value = result.yamlContent; // 设置 frontMatter 字符串内容
  // 设置正文内容到编辑器中
  if (vditorInstance) {
    vditorInstance.setValue(result.content, true);
  }
};

const getContent = () => {
  /**
   * 获取编辑器内容
   * 会将 frontMatter 和 content 合并
   */
  let content = (vditorInstance as any).getValue();
  return frontMatterString.value + content;
};

const saveFile = async () => {
  const file_path = props.path;
  const file_content = getContent();
  // console.log("saveFile file_content", file_content);
  let eventBus: EventBus = new EventBus(EventBusType.FileSaved);

  if (props.native) {
    // 本地文件
    if (!fileHandle.value) {
      throw new Error("找不到文件句柄");
    }

    // 请求写入权限
    const writable = await fileHandle.value.createWritable();
    // 写入内容
    await writable.write(file_content);
    // 关闭写入流
    await writable.close();
  } else {
    // 写入文件
    await fs.write(file_path, file_content, repoName.value);
  }

  eventBus.emit();
  ElMessage({
    message: "文章保存成功",
    grouping: true,
    type: "success",
  });

  isAllSaved.value = true;
};

const inputHandler = (value: string | any[]) => {
  /**
   * 编辑器内容变化时触发
   * 用于更新编辑器状态栏右下角的字数统计
   */
  isAllSaved.value = false;

  eventStore.fileChanged = Math.random().toString(36);
};

const frontMatterChange = (value: any) => {
  /**
   * frontMatter 内容变化时触发
   */

  frontMatterString.value = value;
  isAllSaved.value = false;
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === "s") {
    event.preventDefault();
    saveFile();
  }
};

const handleDragOver = (event: { preventDefault: () => void }) => {
  // 阻止默认行为以允许拖放
  event.preventDefault();
};

const handleDrop = (event: DragEvent) => {
  // 获取拖入的文件
  const dataTransfer = event.dataTransfer;
  if (dataTransfer) {
    const files = dataTransfer.files;
    if (files.length > 0) {
      console.log("拖入的文件:", files);
    }
  }
};

const uploadImage = async (files: File[]): Promise<null> => {
  loading.value = true;

  if (!imagehosting.ready) {
    const base64Results = await convertImagesToMarkdownBase64(files);
    let content = "\n";
    for (let i = 0; i < base64Results.length; i++) {
      const base64Result = base64Results[i];
      content += `${settingsStore.getImageString(
        base64Result.file.name,
        base64Result.url
      )}\n`;
    }

    vditorInstance?.insertValue(content);
    loading.value = false;
    return null;
  }

  const { success, failed } = await imagehosting.upload(files);
  let content = "\n";
  for (let i = 0; i < success.length; i++) {
    const fileExtension = success[i].file.name.split(".").pop() || "";
    let rootUrl = settingsStore.settings["图床配置"].rootUrl;
    if (!rootUrl.endsWith("/")) {
      rootUrl += "/";
    }
    let imgUrl = `${rootUrl}${success[i].hash}.${fileExtension}`;

    content += `${settingsStore.getImageString(
      success[i].file.name,
      imgUrl
    )}\n`;
  }

  vditorInstance?.insertValue(content);

  if (failed.length > 0) {
    for (let i = 0; i < failed.length; i++) {
      ElMessage({
        message: `图片 ${failed[i].name} 上传失败`,
        type: "warning",
      });
    }
  }

  loading.value = false;
  return null;
};
</script>

<template>
  <div
    class="md-editor-box"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
    v-loading="loading"
  >
    <div
      class="editor-region"
      :style="
        currentMode === 'sv'
          ? {}
          : { maxWidth: MaxEditRegionWidth.toString() + 'px' }
      "
    >
      <FrontMatterEditor
        :frontMatterString="frontMatterString"
        @change="frontMatterChange"
      />
      <div :id="editor" class="md-editor"></div>
    </div>

    <div class="editor-status">
      <div class="status-bar-item">
        <div class="changes" v-if="isAllSaved">
          <span class="icon">
            <font-awesome-icon
              style="color: var(--el-color-success)"
              :icon="['fas', 'circle-check']"
            />
          </span>
          <span>已保存</span>
        </div>
        <div class="all-saved" v-else>
          <span class="icon">
            <font-awesome-icon
              style="color: var(--el-color-danger)"
              :icon="['fas', 'circle-exclamation']"
            />
          </span>
          <span>更改未保存</span>
        </div>
      </div>

      <div class="status-bar-item">
        <div class="icon">
          <font-awesome-icon :icon="['fas', 'won-sign']" />
        </div>
        <span>总字数：{{ totalWordsNum }}</span>
      </div>
    </div>
  </div>
</template>

<style>
.vditor {
  border: none !important;
  height: 100% !important;
}

.vditor-toolbar {
  padding: 0 !important;
}

.vditor-reset {
  overflow: visible !important;
  padding: 0 40px !important;
}

.vditor-outline {
  display: none !important;
}
</style>

<style scoped>
.md-editor-box {
  width: 100%;
  height: calc(100vh - 40px);
  /* width: 100%; */
  overflow: auto;
  background-color: #fafbfc;
}

.editor-region {
  margin: auto;
}

.md-editor {
  height: auto !important;
  min-height: 500px;
}

.editor-status {
  position: fixed;
  bottom: 0;
  right: 0;

  height: 20px;
  padding: 0 10px;
  background-color: var(--el-color-primary);
  color: var(--el-color-secondary-text);

  border-radius: 20px 0 0 0;

  display: flex;
  justify-content: flex-end;
  padding: 10px;
  font-size: 14px;
  color: #666;
}

.status-bar-item {
  display: flex;
  align-items: center;
  /* 鼠标指针 */
  cursor: pointer;
  font-size: 14px;
  padding: 0 5px;
  margin: 0 10px;
  color: var(--el-color-white);
}

.status-bar-item:hover {
  background-color: var(--el-color-primary-light-7);
  color: var(--el-color-secondary-text);
}

.status-bar-item .icon {
  margin-right: 5px;
}
</style>
