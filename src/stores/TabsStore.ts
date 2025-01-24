import { TabPaneName } from "element-plus";
import { defineStore } from "pinia";
import { ref, Ref } from "vue";

const generateRandomId = (length: number) => {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const useTabsStore = defineStore("tabs", () => {
  enum TabType {
    File = "file",
    MdFile = "mdFile",
    SettingsPanel = "settings",
  }

  const tabs: Ref<
    {
      id: string;
      type: TabType;
      icon: string;
      data: Record<string, any>;
    }[]
  > = ref([]);

  const activeTabId = ref("");

  const addTab = (type: TabType, icon = "", data: any, id = "") => {
    if (!id) {
      id = generateRandomId(6);
    }

    if (tabs.value.find((tab) => tab.id === id)) {
      setActiveTab(id);
      return;
    }

    tabs.value.push({ id, type, icon, data });
    setActiveTab(id);
  };

  const removeTab = (id: TabPaneName) => {
    const index = tabs.value.findIndex((tab) => tab.id === id);
    if (index !== -1) {
      tabs.value.splice(index, 1);
      // 如果删除的是当前激活的tab，激活前一个或后一个tab
      if (activeTabId.value === id) {
        if (tabs.value.length > 0) {
          // 优先激活前一个tab，如果没有前一个，则激活后一个
          const newIndex = index > 0 ? index - 1 : 0;
          setActiveTab(tabs.value[newIndex].id);
        } else {
          activeTabId.value = "";
        }
      }
    }
  };

  const setActiveTab = (id: string) => {
    activeTabId.value = id;
  };

  const openFile = (path: string, repo: string) => {
    console.log("openFile", path, repo);
    // 防止重复打开
    for (let tab of tabs.value) {
      if (tab.data.path === path) {
        if (tab.data.repo === repo) {
          setActiveTab(tab.id);
          return;
        }
      }
    }

    let title = ref(path.split("/").pop()||"");

    // 如果有路径文件，标题加上repo
    for (let tab of tabs.value) {
      if (tab.data.path === path) {
        tab.data.title = tab.data.title + " @ " + tab.data.repo;
        title.value = path + " @ " + repo;
      }
    }

    // 防止不同目录下同名文件标题相同
    for (let tab of tabs.value) {
      if (tab.data.title === title) {
        let original_tab_title = tab.data.title;
        let original_title = title.value;

        if(original_tab_title.endsWith(" @ " + tab.data.repo)){
          tab.data.title = tab.data.path + " @ " + tab.data.repo;
        } else {
          tab.data.title = tab.data.path;
        }

        if(original_title.endsWith(" @ " + repo)){
          title.value = path + " @ " + repo;
        } else {
          title.value = path;
        }
      }
    }

    let data = {
      path,
      title,
      repo,
    };

    console.log("data", data);

    // 获取后缀
    const ext = path.split(".").pop()?.toLowerCase();
    addTab(
      ext === "md" ? TabType.MdFile : TabType.File,
      ext === "md" ? "m" : "",
      data
    );
  };

  const vditorInstance: Record<string, any> = {};

  return {
    TabType,
    tabs,
    activeTabId,
    vditorInstance,
    addTab,
    removeTab,
    setActiveTab,
    openFile,
  };
});
