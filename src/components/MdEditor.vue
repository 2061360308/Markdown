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
} from "vue";

import { EventBusType, EventBus } from "@/eventBus";
import { ElMessage } from "element-plus";

import fs from "@/utils/githubFs/fs";
import { splitFrontMatter } from "@/utils/frontMatter";

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
});

const frontMatter = ref({});

let vditorInstance: Vditor | null = null;

const openFile = async (path: string) => {
  // 读取文件内容并设置到编辑器中
  console.log("openFile", path);
  fs.get(path).then((content) => {
    console.log("openFile content", content);
    // 分离 frontMatter 和 content
    let result = splitFrontMatter(content);
    frontMatter.value = result.frontMatter;

    // 设置清理后的内容到编辑器中
    if (vditorInstance) {
      vditorInstance.setValue(result.content, true);
    }
  });
};

const createVditorInstance = () => {
  // 等待下一个 tick 确保组件已渲染
  nextTick(() => {
    vditorInstance = new Vditor(props.editor, {
      value:
        "# Hello Vditor!\n\n这是编辑器预设内容，如果你看到这段文字代表内容没有被正确显示！",
      mode: "ir",
      height: "100%",
      input: inputHandler,
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
          hotkey: "⌘S",
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
      after: () => {
        // 确保 vditorInstance 完全初始化后再进行操作

        // 读取文件内容
        openFile(props.path);
        let eventBus: EventBus = new EventBus(
          EventBusType.VditorInstanceCreated
        );
        eventBus.emit({
          name: props.editor,
          vditorInstance: vditorInstance,
        });
      },
    });
  });
};

watch(
  () => props.editor,
  (newVal, oldVal) => {
    createVditorInstance();
  },
  {
    immediate: true,
  }
);

onBeforeUnmount(() => {
  if (vditorInstance) {
    vditorInstance.clearCache(); // 清除缓存
    vditorInstance.destroy(); // 销毁实例
    vditorInstance = null;
  }
});

defineExpose({
  vditorInstance,
});

const inputHandler = (e: string | any[]) => {
  let eventBus: EventBus = new EventBus(EventBusType.FileChanged);
  eventBus.emit(e.length);
};

const saveFile = () => {
  console.log("saveFile");
  const file_path = props.path;
  const file_content = (vditorInstance as any).getValue();
  let eventBus: EventBus = new EventBus(EventBusType.FileSaved);
  fs.write(file_path, file_content).then(() => {
    eventBus.emit();
    ElMessage({
      message: "文章保存成功",
      grouping: true,
      type: "success",
    });
  });
};
</script>

<template>
  <div class="md-editor-box">
    <div :id="editor" class="md-editor"></div>
  </div>
</template>

<style scoped>
.md-editor-box {
  width: 100%;
  height: calc(100vh - 60px);
  /* width: 100%; */
  overflow: auto;
}
</style>
