<script setup lang="ts">
import { defineProps, onMounted, ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ElMessage, ElMessageBox } from "element-plus";
import fs from "@/utils/fs";

const props = defineProps({
  frontMatter: {
    type: Object,
    required: true,
  },
});

const form = ref({
  name: "",
  draft: false,
  describe: "",
  createTime: "",
  keyWords: [],
  modifyTime: "",
  tags: [],
  categories: [],
  others: "",
});

const unfold = ref("1");

const currentCommitMessage = ref("");
const currentIsChanged = ref(false);

const commitMessage = ref("");
const hasChanged = ref(false);
const isRotating = ref(false);
const diff_files = ref<string[]>([]);

const onSubmit = () => {
  console.log("submit!");
};

const currentCommit = () => {
  console.log("commit!");
};

onMounted(() => {
  console.log("frontMatterBlock mounted");
  console.log(props.frontMatter);
});

const refreshClicked = () => {
  console.log("refreshClicked");
};

const refreshDiffData = async () => {
  console.log("refreshDiffData");
};

const undo = (file: string | null = null) => {
  let all_files: string[] = [];
  let undoFiles: string[] = [];
  for (const i in diff_files.value) {
    all_files.push(diff_files.value[i][0]);
  }

  if (!file) {
    undoFiles = all_files;
  } else {
    if (all_files.indexOf(file) === -1) {
      ElMessage({
        type: "error",
        message: "File not found",
      });
      return;
    } else {
      undoFiles = [file];
    }
  }

  ElMessageBox.confirm(
    "此操作将删除本地更改且无法恢复，是否继续？",
    "警告-危险操作",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消，保留更改",
      type: "warning",
    }
  )
    .then(() => {
      undoFiles.forEach((f) => {
        fs.unRemove(f);
      });
      refreshDiffData();
      ElMessage({
        type: "success",
        message: "Delete completed",
      });
    })
    .catch((error) => {
      console.log(error);
      ElMessage({
        type: "info",
        message: "Delete canceled",
      });
    });
};
</script>

<template>
  <div class="editing-manager">
    <div class="title">编辑管理器</div>
    <el-collapse v-model="unfold" accordion>
      <el-collapse-item name="1">
        <template #title>
          <div class="collapse-item-title">当前文章 Front Matter</div>
        </template>
        <div class="el-collapse-item-content">
          <el-form :model="form" label-width="auto" class="form">
            <el-form-item label="文章标题">
              <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="列为草稿">
              <el-switch
                v-model="form.draft"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
            <el-form-item label="文章描述">
              <el-input
                v-model="form.describe"
                :autosize="{ minRows: 2, maxRows: 4 }"
                type="textarea"
                placeholder="请输入文章描述内容"
            /></el-form-item>
            <el-form-item label="关键词">
              <el-input-tag
                v-model="form.keyWords"
                placeholder="输入关键词（回车键入）"
              />
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="form.createTime"
                type="datetime"
                placeholder="Select date and time"
              />
            </el-form-item>
            <el-form-item label="修改时间">
              <el-date-picker
                v-model="form.modifyTime"
                type="datetime"
                placeholder="Select date and time"
              />
            </el-form-item>
            <el-form-item label="文章标签">
              <el-input-tag
                v-model="form.tags"
                placeholder="输入文章标签（回车键入）"
              />
            </el-form-item>
            <el-form-item label="文章分类">
              <el-input-tag
                v-model="form.categories"
                placeholder="输入文章分类（回车键入）"
              />
            </el-form-item>
            <el-form-item label="其他信息">
              <el-input
                v-model="form.others"
                :autosize="{ minRows: 2, maxRows: 4 }"
                type="textarea"
                placeholder="请输入其他信息(yaml格式)"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSubmit">保存</el-button>
              <el-button>还原</el-button>
            </el-form-item>
          </el-form>
          <div class="commit-box">
            <el-input
              v-model="currentCommitMessage"
              :autosize="{ minRows: 2, maxRows: 4 }"
              type="textarea"
              placeholder="commit message"
              clearable
            />
            <el-button
              type="primary"
              :disabled="!currentIsChanged"
              @click="currentCommit"
              >提交到Github</el-button
            >
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item name="2">
        <template #title>
          <div class="collapse-item-title">本地其他未提交的更改</div>
        </template>
        <div class="commit-box">
          <el-input
            v-model="commitMessage"
            :autosize="{ minRows: 2, maxRows: 4 }"
            type="textarea"
            placeholder="commit message"
            clearable
          />
          <el-button
            type="primary"
            :disabled="!hasChanged"
            @click="currentCommit"
            >提交所有到Github</el-button
          >
        </div>
        <div class="operation-box">
          <div class="title">更改列表</div>
          <div>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="刷新数据"
              placement="bottom"
              ><font-awesome-icon
                style="margin-right: 15px"
                :icon="['fas', 'arrows-rotate']"
                :size="'sm'"
                @click="refreshClicked"
                :class="{ 'rotate-animation': isRotating }"
            /></el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="放弃所有更改"
              placement="bottom"
              ><font-awesome-icon
                class="undo_all"
                :icon="['fas', 'rotate-left']"
                :size="'sm'"
                @click="undo()"
            /></el-tooltip>
          </div>
        </div>
        <div class="diff-box">
          <div class="diff-item" v-for="file in diff_files" :key="file">
            <div class="file-info">
              <span class="file-name">{{ file.split("/").pop() }}</span>
              <el-tooltip
                class="box-item"
                effect="dark"
                :content="file[0]"
                placement="right"
                ><span class="file-path">{{
                  file.split("/").slice(0, -1).join("/")
                }}</span></el-tooltip
              >
            </div>
            <div class="others">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="放弃更改"
                placement="bottom"
                ><font-awesome-icon
                  class="undo"
                  :icon="['fas', 'rotate-left']"
                  :size="'xs'"
                  @click="undo(file[0])"
              /></el-tooltip>

              <font-awesome-icon
                v-if="file[1] === 'update'"
                :icon="['fas', 'u']"
                :size="'xs'"
                style="color: var(--el-color-primary)"
              />
              <font-awesome-icon
                v-if="file[1] === 'delete'"
                :icon="['fas', 'd']"
                :size="'xs'"
                style="color: var(--el-color-danger)"
              />
              <font-awesome-icon
                v-if="file[1] === 'create'"
                :icon="['fas', 'n']"
                :size="'xs'"
                style="color: var(--el-color-success)"
              />
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.editing-manager {
  height: 100%;
}

.el-collapse {
  width: 100%;
  height: 100%;
}

.el-collapse-item-content {
  height: calc(100vh - 180px);
  overflow: auto;
}

.collapse-item-title {
  font-size: 12px;
  font-weight: bold;
  padding: 0 10px;
}

.form {
  padding: 0 20px;
}

.commit-box,
.diff-box {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.diff-box {
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: calc(100% - 120px);
}

.diff-item {
  padding: 3px;
  border-bottom: 0.5px solid #c9c9c9;
  white-space: nowrap; /* 确保内容不会换行 */
  display: flex;
  justify-content: space-between;
}

.diff-box .file-name {
  font-weight: bold;
  font-size: 12px;
  margin-right: 3px;
}

.diff-box .file-path {
  display: inline-block;
  font-size: 10px;
  color: #6f6f6f;
  overflow: hidden;
  width: 80px;
  text-overflow: ellipsis;
}

.diff-box .others .undo {
  cursor: pointer;
  margin-right: 5px;
  display: none;
  color: var(--el-color-secondary);
}

.diff-item:hover .undo {
  display: inline-block;
}

.operation-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.operation-box .undo_all {
  cursor: pointer;
  color: var(--el-color-secondary);
}

.operation-box .title {
  font-size: 12px;
  font-weight: bold;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.rotate-animation {
  animation: rotate 0.5s linear infinite;
}
</style>
