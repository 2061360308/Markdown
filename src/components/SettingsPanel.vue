<script lang="ts" setup>
import { ref } from "vue";
import { useSettingsStore } from "@/stores";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const settingsStore = useSettingsStore();

const containerRef = ref<HTMLElement | null>(null);

const handleClick = (e: MouseEvent) => {
  e.preventDefault();
};
</script>

<template>
  <div class="main">
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
