import { defineStore } from "pinia";
import { ref, computed, Ref, watch } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  enum EditorMode {
    /**
     * 编辑器模式
     *
     * 所见即所得 wysiwyg
     * 即时渲染 ir
     * 分屏预览 sv
     */
    WYSIWYG = "wysiwyg",
    IR = "ir",
    SV = "sv",
  }

  enum InputType {
    lineInput = "lineInput",
    textInput = "textInput",
    numberInput = "numberInput",
    selectInput = "selectInput",
    colorInput = "colorInput",
    booleanInput = "booleanInput",
}

  const themeName = ref<string>("default"); // 主题名称
  const repoName = ref<string>(""); // 仓库名称
  const repoBranch = ref<string>(""); // 使用的仓库分支
  const repoPath = ref<string>(""); // 使用的仓库根路径
  const defaultFrontMatter = ref<string>(""); // 默认创建文章时的 front matter
  const editorDefaultMode = ref<EditorMode>(EditorMode.IR); // 默认编辑器模式
  const editorMaxWidth = ref<number>(800); // 编辑器最大宽度
  const editorTypewriterMode = ref<boolean>(false); // 打字机模式
  const editorAutoSpace = ref<boolean>(true); // 自动空格
  const editorGfmAutoLink = ref<boolean>(true); // 自动链接

  const settingsInputTypes: Record<string, InputType> = {
    themeName: InputType.selectInput,
    repoName: InputType.lineInput,
    repoBranch: InputType.lineInput,
    repoPath: InputType.lineInput,
    defaultFrontMatter: InputType.textInput,
    editorDefaultMode: InputType.selectInput,
    editorMaxWidth: InputType.numberInput,
    editorTypewriterMode: InputType.booleanInput,
    editorAutoSpace: InputType.booleanInput,
    editorGfmAutoLink: InputType.booleanInput,
  }

  const settingsInputLabels: Record<string, string> = {
    themeName: "主题",
    repoName: "仓库名称",
    repoBranch: "仓库分支",
    repoPath: "仓库路径",
    defaultFrontMatter: "默认 front matter",
    editorDefaultMode: "默认编辑器模式",
    editorMaxWidth: "编辑器最大宽度",
    editorTypewriterMode: "打字机模式",
    editorAutoSpace: "自动空格",
    editorGfmAutoLink: "自动链接",
  }

  const settingsInputDescriptions: Record<string, string> = {
    themeName: "主题名称：用于设置应用程序的主题样式。",
    repoName: "仓库名称：指定远程仓库的名称。",
    repoBranch: "仓库分支：指定要使用的远程仓库分支。",
    repoPath: "仓库路径：指定本地仓库的路径。",
    defaultFrontMatter: "默认 front matter：用于新建文件时的默认 front matter 配置。",
    editorDefaultMode: "默认编辑器模式：设置编辑器的默认模式，例如 Markdown 或富文本。",
    editorMaxWidth: "编辑器最大宽度：设置编辑器的最大显示宽度。",
    editorTypewriterMode: "打字机模式：启用或禁用打字机模式，使当前行始终保持在视图中间。",
    editorAutoSpace: "自动空格：启用或禁用自动空格功能。",
    editorGfmAutoLink: "自动链接：启用或禁用 GitHub 风格的自动链接功能。",
    editorLineNumbers: "显示行号：启用或禁用编辑器中的行号显示。",
    editorHighlightActiveLine: "高亮当前行：启用或禁用高亮显示编辑器中的当前行。",
    editorTabSize: "Tab 大小：设置编辑器中 Tab 字符的宽度。",
    editorFontFamily: "字体：设置编辑器中使用的字体。",
    editorFontSize: "字体大小：设置编辑器中使用的字体大小。",
    editorLineHeight: "行高：设置编辑器中行与行之间的高度。",
    editorTheme: "编辑器主题：设置编辑器的配色主题。",
    editorAutoSave: "自动保存：启用或禁用编辑器的自动保存功能。",
    editorSpellCheck: "拼写检查：启用或禁用编辑器中的拼写检查功能。",
    editorCodeFolding: "代码折叠：启用或禁用编辑器中的代码折叠功能。",
    editorWordWrap: "自动换行：启用或禁用编辑器中的自动换行功能。",
    editorShowWhitespace: "显示空白字符：启用或禁用编辑器中显示空白字符。",
    editorBracketMatching: "括号匹配：启用或禁用编辑器中的括号匹配功能。",
    editorAutoComplete: "自动补全：启用或禁用编辑器中的自动补全功能。",
    editorLinting: "代码检查：启用或禁用编辑器中的代码检查功能。",
  };

  const selectInputOptions: Record<string, string[]> = {
    themeName: ["default", "light", "dark"],
    editorDefaultMode: [EditorMode.WYSIWYG, EditorMode.IR, EditorMode.SV],
  }

  const settings: Record<string, Record<string, Ref<any>>> = {
    基本配置: {
      themeName: themeName,
      repoName: repoName,
      repoBranch: repoBranch,
      repoPath: repoPath,
    },
    编辑器配置: {
      defaultFrontMatter: defaultFrontMatter,
      editorDefaultMode: editorDefaultMode,
      editorMaxWidth: editorMaxWidth,
      editorTypewriterMode: editorTypewriterMode,
      editorAutoSpace: editorAutoSpace,
      editorGfmAutoLink: editorGfmAutoLink,
    },
  };

  const saveSettings = () => {
    // 保存设置
    let data: Record<string, any> = {};
    for (let groupname in settings) {
      let group = settings[groupname];
      Object.keys(group).forEach((key: string) => {
        let value = group[key].value;
        data[key] = value;
      });
    }

    
  };

  // 监测设置项变化
  for (let groupname in settings) {
    let group = settings[groupname];
    Object.keys(group).forEach((key: string) => {
      watch(group[key], (newValue, oldValue) => {
        saveSettings();
      });
    });
  }

  return {
    InputType,
    settings,
    settingsInputTypes,
    settingsInputLabels,
    settingsInputDescriptions,
    selectInputOptions,
  };
});
