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
import { ElMessage, ElMessageBox } from "element-plus";

import fs from "@/utils/githubFs/fs";
import { splitFrontMatter, stringifyFrontMatter } from "@/utils/frontMatter";
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuItem,
} from "@imengyu/vue3-context-menu";

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

let vditorInstance: Vditor | null = null;

defineExpose({
  vditorInstance,
});

const MaxEditRegionWidth = 800; // 最大编辑区域宽度

// frontMatter 属性值类型
enum fronMatterValueType {
  string = "string",
  array = "array",
  number = "number",
  boolean = "boolean",
  date = "date",
  dateTime = "dateTime",
}

// frontMatter
const frontMatter = ref<
  Array<{ name: string; type: fronMatterValueType; value: any }>
>([]);

// frontMatter的备份数据
// 如果用户输入的不合法将从此数组中恢复（如果有）
// 只需要备份属性名即可
let frontMatterBack: Array<string> = [];

// frontMatter 原始yaml对象，
// 无法可视化的数据（复杂嵌套数据），会保存在这里
// 写回文件时会将这里的数据转换为yaml字符串
let frontMatterObject = <Record<string, any>>{};

// 文章标题
const textarea1 = ref("");

// 属性类型选择菜单弹出坐标
const optionsComponent = ref<{ x: number; y: number }>({ x: 0, y: 0 });

// 属性类型选择菜单是否显示标识
const menuVisible = ref(false);

// 当前正在编辑的 frontMatter 索引
let currentFrontMatterIndex = 0;

const isFrontMatterFold = ref(false); // 文档属性折叠标识

const createVditorInstance = () => {
  /**
   * 创建 Vditor 实例
   */

  // 等待下一个 tick 确保组件已渲染
  nextTick(() => {
    vditorInstance = new Vditor(props.editor, {
      value:
        "# Hello Vditor!\n\n这是编辑器预设内容，如果你看到这段文字代表内容没有被正确显示！",
      mode: "ir",
      height: "100%",
      input: inputHandler,
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
});

const openFile = async (path: string) => {
  /**
   * 读取文件内容并设置到编辑器中
   * 会将 frontMatter 的内容分离出来，并设置到 frontMatter 中
   * 由 createVditorInstance 创建完Vditor实例后调用
   *  */
  console.log("openFile", path);
  fs.get(path).then((content) => {
    console.log("openFile content", content);
    // 分离 frontMatter 和 content
    let result: { frontMatter: Record<string, any>; content: string } =
      splitFrontMatter(content);
    frontMatterObject = result.frontMatter;
    for (const key in frontMatterObject) {
      let value = frontMatterObject[key];
      let type = typeof value;

      let item_type: fronMatterValueType = fronMatterValueType.string;

      if (type === "string") {
        item_type = fronMatterValueType.string;
      } else if (type === "number") {
        item_type = fronMatterValueType.number;
      } else if (type === "boolean") {
        item_type = fronMatterValueType.boolean;
      } else if (type === "object") {
        if (Array.isArray(value)) {
          item_type = fronMatterValueType.array;
        } else if (value instanceof Date) {
          item_type = fronMatterValueType.date;
        }
      } else {
        continue; // 其他类型不处理, 暂时不支持
      }

      frontMatter.value.push({
        name: key,
        type: item_type,
        value: value,
      });
    }

    frontMatterBack = frontMatter.value.map((item) => item.name);

    // 设置清理后的内容到编辑器中
    if (vditorInstance) {
      vditorInstance.setValue(result.content, true);
    }
  });
};

const getContent = () => {
  /**
   * 获取编辑器内容
   * 会将 frontMatter 和 content 合并
   */
  let yamlFrontMatter = stringifyFrontMatter(frontMatterObject);
  let content = (vditorInstance as any).getValue();
  return yamlFrontMatter + content;
};

const saveFile = () => {
  console.log("saveFile");
  const file_path = props.path;
  const file_content = getContent();
  console.log("saveFile file_content", file_content);
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

const inputHandler = (e: string | any[]) => {
  /**
   * 编辑器内容变化时触发
   * 用于更新编辑器状态栏右下角的字数统计
   */
  let eventBus: EventBus = new EventBus(EventBusType.FileChanged);
  eventBus.emit(e.length);
};

const showTypeSelectMenu = (event: MouseEvent, index: number) => {
  /**
   * 显示属性类型选择菜单
   */
  currentFrontMatterIndex = index;
  optionsComponent.value = { x: event.clientX, y: event.clientY };
  menuVisible.value = true;
};

const changeAttributeType = (type: fronMatterValueType) => {
  /**
   * 修改属性类型
   */
  console.log("currentFrontMatterIndex", currentFrontMatterIndex);
  if (frontMatter.value[currentFrontMatterIndex].value) {
    ElMessageBox.confirm(
      "修改属性类将导致原有值被丢弃，确认修改吗？",
      "Warning",
      {
        confirmButtonText: "修改",
        cancelButtonText: "保留原值",
        type: "warning",
      }
    )
      .then(() => {
        // 清空对应的属性值
        let newValue: any = "";
        if (type === fronMatterValueType.array) {
          frontMatter.value[currentFrontMatterIndex].value = [];
        } else if (type === fronMatterValueType.number) {
          frontMatter.value[currentFrontMatterIndex].value = 0;
        } else if (type === fronMatterValueType.boolean) {
          frontMatter.value[currentFrontMatterIndex].value = false;
        } else if (type === fronMatterValueType.date) {
          frontMatter.value[currentFrontMatterIndex].value = new Date();
        } else if (type === fronMatterValueType.dateTime) {
          frontMatter.value[currentFrontMatterIndex].value = new Date();
        } else {
          frontMatter.value[currentFrontMatterIndex].value = "";
        }

        frontMatter.value[currentFrontMatterIndex].value = newValue;

        // 修改属性类型
        frontMatter.value[currentFrontMatterIndex].type = type;
        // 修改属性类型后，更新 frontMatterObject
        frontMatterObject[frontMatter.value[currentFrontMatterIndex].name] =
          frontMatter.value[currentFrontMatterIndex].value;
        ElMessage({
          type: "success",
          message: "属性修改成功",
        });
      })
      .catch(() => {
        ElMessage({
          type: "info",
          message: "取消修改",
        });
      });
  } else {
    let newValue: any = "";
    if (type === fronMatterValueType.array) {
      frontMatter.value[currentFrontMatterIndex].value = [];
    } else if (type === fronMatterValueType.number) {
      frontMatter.value[currentFrontMatterIndex].value = 0;
    } else if (type === fronMatterValueType.boolean) {
      frontMatter.value[currentFrontMatterIndex].value = false;
    } else if (type === fronMatterValueType.date) {
      frontMatter.value[currentFrontMatterIndex].value = new Date();
    } else if (type === fronMatterValueType.dateTime) {
      frontMatter.value[currentFrontMatterIndex].value = new Date();
    } else {
      frontMatter.value[currentFrontMatterIndex].value = "";
    }

    frontMatter.value[currentFrontMatterIndex].value = newValue;

    // 修改属性类型
    frontMatter.value[currentFrontMatterIndex].type = type;
    // 修改属性类型后，更新 frontMatterObject
    frontMatterObject[frontMatter.value[currentFrontMatterIndex].name] =
      frontMatter.value[currentFrontMatterIndex].value;
  }

  menuVisible.value = false;
};

const addPostAttribute = () => {
  /**
   * 添加文档属性
   */
  if (!frontMatter.value[frontMatter.value.length - 1].name) {
    return;
  }

  frontMatter.value.push({
    name: "",
    type: fronMatterValueType.string,
    value: "",
  });
};

const attributeNameInputComplate = (index: number) => {
  /**
   * 属性名输入框完成时触发
   * 用于验证属性名输入框的数据
   */
  const restoreOrRemoveAttribute = (index: number) => {
    /**
     * 恢复或删除错误的文档属性
     */
    if (frontMatterBack[index]) {
      frontMatter.value[index].name = frontMatterBack[index];
    } else {
      frontMatter.value.splice(index, 1);
    }
  };

  if (!frontMatter.value[index].name) {
    // 查看之前是否有值，有值恢复, 没有值删除
    restoreOrRemoveAttribute(index);
  } else {
    const existingIndex = frontMatterBack.findIndex(
      (item) => item === frontMatter.value[index].name
    );
    if (existingIndex !== -1) {
      console.log("之前有这个值");
      // 查看之前是否有值，有值恢复, 没有值删除
      restoreOrRemoveAttribute(index);
      return;
    } else {
      // 达成条件，更新 frontMatterBack 和 frontMatterObject
      let originName = frontMatterBack[index];
      frontMatterBack[index] = frontMatter.value[index].name;
      // 删除原来的键值
      delete frontMatterObject[originName];
      // 添加新的键值
      frontMatterObject[frontMatter.value[index].name] =
        frontMatter.value[index].value;
    }
  }
};

const attributeValueInputComplate = (index: number) => {
  /**
   * 属性值输入框完成时触发
   * 用于验证属性值输入框的数据
   */

  // 直接更新值就好
  frontMatterObject[frontMatter.value[index].name] =
    frontMatter.value[index].value;
};

// const attributeBlur = (index: number, changeName: boolean = false) => {
//   /**
//    * 属性输入框失去焦点时触发
//    * 用于验证属性输入框的数据
//    */

//   console.log("attributeBlur", index);

//   if (!frontMatter.value[index].name) {
//     // 查看之前是否有值，有值恢复, 没有值删除
//     restoreOrRemoveAttribute(index);
//   } else {
//     if (changeName) {
//       // 更改属性名,需要判断是否有重复的属性名
//       // 如果 name 有值，查看之前是否已经有这个值
//     }

//     // 达成条件，更新 frontMatterBack 和 frontMatterObject
//     // 1. name 不能为空且不能重复
//     // 2. 更新value的值
//     console.log("之前没有这个值");
//     // 如果之前没有这个值，则更新 frontMatterBack 数组
//   }
// };
</script>

<template>
  <div class="md-editor-box">
    <div
      class="editor-region"
      :style="{ maxWidth: MaxEditRegionWidth.toString() + 'px' }"
    >
      <div class="front-matter">
        <el-input
          v-model="textarea1"
          autosize
          type="textarea"
          placeholder="未命名"
          class="el-front-matter-custom post-title"
          style="margin: 20px 0"
        />
        <div
          class="front-matter-fold-bar"
          @click="isFrontMatterFold = !isFrontMatterFold"
        >
          <span class="icon">
            <font-awesome-icon
              :icon="['fas', 'chevron-right']"
              v-if="isFrontMatterFold"
            />
            <font-awesome-icon :icon="['fas', 'chevron-down']" v-else />
          </span>
          <span>文档属性</span>
        </div>
        <div v-show="!isFrontMatterFold">
          <div class="front-matter-item" v-for="(item, index) in frontMatter">
            <el-input
              v-model="item.name"
              style="width: 240px"
              placeholder="输入属性名"
              class="el-front-matter-custom"
              autofocus
              @blur="attributeNameInputComplate(index)"
            >
              <template #prefix>
                <div @click="showTypeSelectMenu($event, index)">
                  <font-awesome-icon
                    class="type-icon"
                    :icon="['fas', 'align-left']"
                    size="xl"
                    v-if="item.type === fronMatterValueType.string"
                  />
                  <font-awesome-icon
                    class="type-icon"
                    :icon="['fas', 'list']"
                    size="xl"
                    v-else-if="item.type === fronMatterValueType.array"
                  />
                  <font-awesome-icon
                    class="type-icon"
                    :icon="['fas', 'arrow-up-1-9']"
                    size="xl"
                    v-else-if="item.type === fronMatterValueType.number"
                  />
                  <font-awesome-icon
                    class="type-icon"
                    :icon="['fas', 'square-check']"
                    size="xl"
                    v-else-if="item.type === fronMatterValueType.boolean"
                  />
                  <font-awesome-icon
                    class="type-icon"
                    :icon="['fas', 'calendar-days']"
                    size="xl"
                    v-else-if="item.type === fronMatterValueType.date"
                  />
                  <font-awesome-icon
                    class="type-icon"
                    :icon="['fas', 'clock']"
                    size="xl"
                    v-else-if="item.type === fronMatterValueType.dateTime"
                  />
                </div>
              </template>
            </el-input>
            <el-input
              v-model="item.value"
              placeholder="输入属性值（文本）"
              class="el-front-matter-custom"
              @blur="attributeValueInputComplate(index)"
              v-if="item.type === fronMatterValueType.string"
            />
            <el-input-tag
              v-model="item.value"
              placeholder="输入属性值（列表），Tip：回车可键入"
              class="el-front-matter-custom"
              @blur="attributeValueInputComplate(index)"
              v-if="item.type === fronMatterValueType.array"
            />
            <el-input-number
              v-model="item.value"
              controls-position="right"
              style="width: 100%"
              class="el-front-matter-custom"
              @blur="attributeValueInputComplate(index)"
              v-if="item.type === fronMatterValueType.number"
            />
            <el-switch
              v-model="item.value"
              style="
                --el-switch-on-color: #13ce66;
                --el-switch-off-color: #ff4949;
                width: 100%;
                padding: 0 10px;
              "
              @blur="attributeValueInputComplate(index)"
              v-if="item.type === fronMatterValueType.boolean"
            />
            <el-date-picker
              v-model="item.value"
              type="date"
              placeholder="选取日期"
              style="width: 100%"
              class="el-front-matter-custom"
              @blur="attributeValueInputComplate(index)"
              v-if="item.type === fronMatterValueType.date"
            />
            <el-date-picker
              v-model="item.value"
              type="datetime"
              placeholder="选取日期和时间"
              style="width: 100%"
              class="el-front-matter-custom"
              @blur="attributeValueInputComplate(index)"
              v-if="item.type === fronMatterValueType.dateTime"
            />
          </div>
          <el-button
            style="margin: 10px"
            @click="addPostAttribute"
            type=""
            text
          >
            <template #default>
              <font-awesome-icon :icon="['fas', 'plus']" />
              添加属性
            </template>
          </el-button>
        </div>
        <context-menu v-model:show="menuVisible" :options="optionsComponent">
          <context-menu-group label="属性类型" icon="fas fa-plus">
            <context-menu-item
              label="文本"
              :clickClose="true"
              data-filetype="post"
              @click="changeAttributeType(fronMatterValueType.string)"
            >
              <template #icon>
                <font-awesome-icon :icon="['fas', 'align-left']" />
              </template>
            </context-menu-item>
            <context-menu-item
              label="列表"
              :clickClose="true"
              data-filetype="draft"
              @click="changeAttributeType(fronMatterValueType.array)"
            >
              <template #icon>
                <font-awesome-icon :icon="['fas', 'list']" />
              </template>
            </context-menu-item>

            <ContextMenuSeparator />

            <context-menu-item
              label="数字"
              :clickClose="true"
              data-filetype="file"
              @click="changeAttributeType(fronMatterValueType.number)"
            >
              <template #icon>
                <font-awesome-icon :icon="['fas', 'arrow-up-1-9']" />
              </template>
            </context-menu-item>
            <context-menu-item
              label="布尔值"
              :clickClose="true"
              data-filetype="file"
              @click="changeAttributeType(fronMatterValueType.boolean)"
            >
              <template #icon>
                <font-awesome-icon :icon="['fas', 'square-check']" />
              </template>
            </context-menu-item>
            <context-menu-item
              label="日期"
              :clickClose="true"
              data-filetype="file"
              @click="changeAttributeType(fronMatterValueType.date)"
            >
              <template #icon>
                <font-awesome-icon :icon="['fas', 'calendar-days']" />
              </template>
            </context-menu-item>
            <context-menu-item
              label="日期和时间"
              :clickClose="true"
              data-filetype="file"
              @click="changeAttributeType(fronMatterValueType.dateTime)"
            >
              <template #icon>
                <font-awesome-icon :icon="['fas', 'clock']" />
              </template>
            </context-menu-item>
          </context-menu-group>

          <context-menu-item label="剪贴" :clickClose="false">
            <template #icon>
              <font-awesome-icon :icon="['fas', 'i-cursor']" />
            </template>
          </context-menu-item>
          <context-menu-item label="复制" :clickClose="false">
            <template #icon>
              <font-awesome-icon :icon="['fas', 'copy']" /> </template
          ></context-menu-item>
          <context-menu-item label="粘贴" :clickClose="false">
            <template #icon>
              <font-awesome-icon :icon="['fas', 'paste']" /> </template
          ></context-menu-item>
          <context-menu-item label="删除" :clickClose="false">
            <template #icon>
              <font-awesome-icon
                :icon="['fas', 'trash']"
                style="color: var(--el-color-danger)"
              />
            </template>
          </context-menu-item>
        </context-menu>
      </div>
      <div :id="editor" class="md-editor"></div>
    </div>
  </div>
</template>

<style>
.el-front-matter-custom .el-input__wrapper,
.el-front-matter-custom .el-textarea__inner,
.el-front-matter-custom {
  box-shadow: none !important;
  border: none !important;
  resize: none;
}

.el-front-matter-custom .el-input__wrapper:focus-within,
.el-front-matter-custom .el-textarea__inner:focus-within,
.el-front-matter-custom:focus-within {
  background-color: antiquewhite;
}
</style>

<style scoped>
.post-title {
  font-size: 28px;
  color: #e78a4e;
  font-weight: bold;
  font-family: "微软雅黑", Courier, monospace;
}

.front-matter-fold-bar {
  margin: 20px;
  cursor: default;
  width: 100%;
  font-size: 18px;
  user-select: none;
  position: relative;
}

.front-matter-fold-bar .icon {
  position: absolute;
  font-size: 10px;
  left: -15px; /* 调整图标的位置 */
  top: 50%;
  transform: translateY(-50%);
}

.front-matter-item {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.front-matter-item:focus-within {
  border: 1px solid #e78a4e;
}

.type-icon {
  cursor: default;
}

.type-icon:hover {
  color: #e78a4e;
}

.md-editor-box {
  width: 100%;
  height: calc(100vh - 60px);
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
</style>

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
