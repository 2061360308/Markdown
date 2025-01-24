<script lang="ts" setup>
import { ref, onMounted, watch, computed } from "vue";
import { useSettingsStore, useGlobalStore } from "@/stores";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "@/utils/api";
import { checkRepo, checkInstalledApp } from "@/utils/api";
import { decryptToken } from "@/utils/encryptToken";
import { ElMessage } from "element-plus";
import { githubAppName } from "@/config";

const settingsStore = useSettingsStore();
const globalStore = useGlobalStore();

const containerRef = ref<HTMLElement | null>(null);

const repoName = computed(() => settingsStore.settings["基本配置"].repoName);
const branchName = computed(() => settingsStore.settings["基本配置"].repoBranch);
const loading = ref(false);

onMounted(async () => {
  // 初始化时更新仓库选项
  settingsStore.selectInputOptions.repoName = ref<string[]>([]);
  let repos = await api.getRepoNames();

  repos.forEach(
    (repo: {
      id: number;
      node_id: string;
      name: string;
      full_name: string;
      license: {
        key: string;
        name: string;
        url: string | null;
        spdx_id: string | null;
        node_id: string;
        html_url?: string | undefined;
      } | null;
      [key: string]: any;
    }) => {
      (settingsStore.selectInputOptions.repoName as unknown as string[]).push(
        repo.name
      );
    }
  );

  updataBranchesOptions(); // 初始化时更新分支选项
});

const updataBranchesOptions = async () => {
  settingsStore.selectInputOptions.repoBranch = ref<string[]>([]);
  let branches = await api.getRepoBranches();

  if (!branches) return;

  branches.forEach(
    (branch: { name: string; commit: { sha: string; url: string } }) => {
      console.log("branch", branch.name);
      (settingsStore.selectInputOptions.repoBranch as unknown as string[]).push(
        branch.name
      );
    }
  );

  console.log(
    "updataBranchesOptions",
    settingsStore.selectInputOptions.repoBranch
  );
};

const updateRepo = async () => {
  // 更新api配置
  let access_token = localStorage.getItem("access_token");
  if (!access_token) {
    globalStore.goLogin();
    return;
  }

  const token = decryptToken(access_token as string);

  loading.value = true;
  // 检查仓库权限
  const { repoValid, hasPushAccess } = await checkRepo(
    api.owner as string,
    settingsStore.settings["基本配置"].repoName,
    token
  );

  if (!repoValid || !hasPushAccess) {
    ElMessage.error("仓库不存在或无权限访问");
    settingsStore.settings["基本配置"].repoName = "";
    globalStore.goLogin();
    loading.value = false;
    return;
  }

  // 检查安装应用
  const installed = await checkInstalledApp(
    settingsStore.settings["基本配置"].repoName,
    token
  );

  if (!installed) {
    ElMessage.error("请先安装应用");
    const url = `https://github.com/apps/${githubAppName}/installations/new`;
    window.open(url, "_blank");
  }

  api.repo = settingsStore.settings["基本配置"].repoName;

  await updataBranchesOptions();

  // 当前分支不在分支选项中时，自动选择第一个分支
  let currentBranch = settingsStore.settings["基本配置"].repoBranch;

  if (
    !(
      settingsStore.selectInputOptions.repoBranch as unknown as string
    ).includes(currentBranch)
  ) {
    if (
      (settingsStore.selectInputOptions.repoBranch as unknown as string)
        .length > 0
    ) {
      settingsStore.settings["基本配置"].repoBranch = (
        settingsStore.selectInputOptions.repoBranch as unknown as string
      )[0];
    }
  }

  loading.value = false;
};

watch(repoName, updateRepo);

watch(branchName, async () => {
  // 更新api配置
  api.branch = settingsStore.settings["基本配置"].repoBranch;
});

const handleClick = (e: MouseEvent) => {
  e.preventDefault();
};
</script>

<template>
  <div class="main" v-loading="loading">
    <div class="settings-box" ref="containerRef">
      <el-form label-position="top">
        <div
          class="group"
          :id="'group-' + groupName"
          v-for="groupName in Object.keys(settingsStore.settings)"
        >
          <div class="setting-group-title">{{ groupName }}</div>
          <el-form-item
            v-for="settingName in Object.keys(
              settingsStore.settings[groupName]
            )"
          >
            <template #label>
              <el-tooltip
                class="box-item"
                effect="dark"
                :content="settingsStore.settingsInputDescriptions[settingName]"
                placement="right-start"
                >{{ settingsStore.settingsInputLabels[settingName] }}
              </el-tooltip>
            </template>

            <el-input
              v-model="settingsStore.settings[groupName][settingName]"
              v-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.lineInput
              "
            />
            <el-input
              v-model="settingsStore.settings[groupName][settingName]"
              autosize
              type="textarea"
              placeholder="Please input"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.textInput
              "
            />
            <el-input-number
              v-model="settingsStore.settings[groupName][settingName]"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.numberInput
              "
            />
            <el-switch
              v-model="settingsStore.settings[groupName][settingName]"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.booleanInput
              "
            />
            <el-select
              v-model="settingsStore.settings[groupName][settingName]"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.selectInput
              "
            >
              <el-option
                v-for="option in settingsStore.selectInputOptions[settingName]"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
    </div>
    <div class="slider-anchors">
      <el-anchor
        :container="containerRef"
        direction="vertical"
        type="default"
        :offset="30"
        @click="handleClick"
      >
        <el-anchor-link
          :href="'#group-' + groupName"
          :title="groupName"
          v-for="groupName in Object.keys(settingsStore.settings)"
        />
      </el-anchor>
    </div>
  </div>
</template>

<style scoped>
.main {
  display: flex;
  width: 100%;
  height: 100vh;
}

.settings-box {
  width: calc(100% - 230px);
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.slider-anchors {
  border-left: 1px solid var(--el-border-color-light);
  width: 230px;
  padding: 10px;
}

.setting-group-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  padding: 10px;
  border-bottom: 2px solid var(--el-border-color-light);
}
</style>
